import mongoose, { Types } from "mongoose";
import {
  createHash,
  randomBytes
} from "node:crypto";

import {
  ProjectStatus,
  ReviewInvitationStatus,
  ReviewStatus
} from "@primeace/shared";

import { ApiError } from "../../shared/errors/ApiError.js";
import { AuditLog } from "../audit/Auditlog.js";
import { Project } from "../projects/Project.js";
import { Review } from "./Review.js";
import { ReviewInvitation } from "./ReviewInvitation.js";
import { ReviewEmailOutbox } from "./ReviewEmailOutbox.js";

const INVITATION_VALIDITY_DAYS = 7;

interface AuditContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface InvitationAuditInput {
  actorId: Types.ObjectId;
  action: string;
  resourceId: Types.ObjectId;
  description: string;
  changes?: Record<string, unknown>;
  context?: AuditContext;
}

interface ListReviewInvitationsInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReviewInvitationStatus;
}

interface CreateReviewInvitationResult {
  invitation: InstanceType<typeof ReviewInvitation>;
  token: string;
}

interface SubmitClientReviewInput {
  token: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  displayPreference: "full_name" | "first_name" | "anonymous";
  consentToPublish: boolean;
}

function validateObjectId(
  value: string,
  field: string
): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `A valid ${field} is required.`);
  }

  return new Types.ObjectId(value);
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function generateInvitationReference(): string {
  return `RVI-${Date.now()}-${randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
}

function getExpiryDate(): Date {
  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + INVITATION_VALIDITY_DAYS
  );

  return expiresAt;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDisplayName(
  fullName: string,
  preference: SubmitClientReviewInput["displayPreference"]
): string {
  const trimmedName = fullName.trim();

  switch (preference) {
    case "full_name":
      return trimmedName;

    case "first_name":
      return trimmedName.split(/\s+/)[0] ?? trimmedName;

    case "anonymous":
      return "Anonymous Client";
  }
}

/**
 * Cancels an invitation email that has not been sent.
 *
 * Clearing the encrypted token prevents a queued email from
 * being retried after its invitation has been invalidated.
 *
 * The operation participates in the invitation transaction.
 */
async function cancelUnsentInvitationEmail(
  invitationId: Types.ObjectId,
  session: mongoose.ClientSession
): Promise<void> {
  await ReviewEmailOutbox.updateOne(
    {
      invitationId,
      status: {
        $in: ["pending", "sending", "failed"]
      }
    },
    {
      $set: {
        status: "cancelled",
        encryptedToken: null,
        iv: null,
        authTag: null,
        lastError: null
      }
    },
    { session }
  );
}

/**
 * Cancels the previous email record during renewal.
 *
 * Even a previously sent record is reset because the invitation
 * is being issued with a replacement token.
 */
async function cancelPreviousInvitationEmail(
  invitationId: Types.ObjectId,
  session: mongoose.ClientSession
): Promise<void> {
  await ReviewEmailOutbox.updateOne(
    { invitationId },
    {
      $set: {
        status: "cancelled",
        encryptedToken: null,
        iv: null,
        authTag: null,
        lastError: null
      }
    },
    { session }
  );
}

async function writeInvitationAuditLog(
  input: InvitationAuditInput,
  session: mongoose.ClientSession
): Promise<void> {
  await AuditLog.create(
    [
      {
        actorId: input.actorId,
        action: input.action,
        resourceType: "review_invitation",
        resourceId: input.resourceId,
        description: input.description,
        changes: input.changes ?? null,
        metadata: null,
        ipAddress: input.context?.ipAddress ?? null,
        userAgent: input.context?.userAgent ?? null
      }
    ],
    { session }
  );
}

/**
 * Creates a review invitation for a completed project.
 *
 * The raw token is returned once and must not be stored.
 * Email delivery is handled separately.
 */
export async function createReviewInvitation(
  projectId: string,
  adminId: string,
  context: AuditContext = {}
): Promise<CreateReviewInvitationResult> {
  const projectObjectId = validateObjectId(
    projectId,
    "project ID"
  );

  const actorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const token = generateToken();
  const tokenHash = hashToken(token);

  const session = await mongoose.startSession();

  let createdInvitation:
    | InstanceType<typeof ReviewInvitation>
    | undefined;

  try {
    createdInvitation = await session.withTransaction(
      async () => {
        const project = await Project.findOne({
          _id: projectObjectId,
          status: ProjectStatus.COMPLETED,
          isDeleted: false
        }).session(session);

        if (!project) {
          throw new ApiError(
            404,
            "The completed project could not be found."
          );
        }

        if (!project.clientSnapshot.email?.trim()) {
          throw new ApiError(
            400,
            "The client does not have an email address recorded for this project."
          );
        }

        const existingReview = await Review.findOne({
          projectId: projectObjectId
        }).session(session);

        if (existingReview) {
          throw new ApiError(
            409,
            "A review already exists for this project."
          );
        }

        const existingInvitation =
          await ReviewInvitation.findOne({
            projectId: projectObjectId
          }).session(session);

        if (existingInvitation) {
          throw new ApiError(
            409,
            "An invitation already exists for this project. Renew the existing invitation if necessary."
          );
        }

        const [invitation] = await ReviewInvitation.create(
          [
            {
              invitationReference: generateInvitationReference(),
              tokenHash,
              projectId: projectObjectId,
              clientId: project.clientId,
              reviewId: null,
              status: ReviewInvitationStatus.PENDING,
              sentAt: null,
              expiresAt: getExpiryDate(),
              submittedAt: null,
              revokedAt: null
            }
          ],
          { session }
        );

        if (!invitation) {
          throw new ApiError(
            500,
            "The review invitation could not be created."
          );
        }

        await writeInvitationAuditLog(
          {
            actorId,
            action: "review_invitation.created",
            resourceId: invitation._id,
            description:
              "An administrator created a client review invitation.",
            changes: {
              projectId: projectObjectId.toString(),
              invitationReference: invitation.invitationReference,
              status: ReviewInvitationStatus.PENDING
            },
            context
          },
          session
        );

        return invitation;
      }
    );
  } finally {
    await session.endSession();
  }

  if (!createdInvitation) {
    throw new ApiError(
      500,
      "The review invitation could not be created."
    );
  }

  return {
    invitation: createdInvitation,
    token
  };
}

/**
 * Lists review invitations in the administrator workspace.
 */
export async function getReviewInvitations(
  input: ListReviewInvitationsInput = {}
) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  const filter: Record<string, unknown> = {};

  if (input.status) {
    filter.status = input.status;
  }

  if (input.search?.trim()) {
    const searchRegex = new RegExp(
      escapeRegex(input.search.trim()),
      "i"
    );

    const matchingProjects = await Project.find({
      $or: [
        { projectReference: searchRegex },
        { title: searchRegex },
        { "clientSnapshot.fullName": searchRegex },
        { "clientSnapshot.email": searchRegex },
        { "clientSnapshot.phone": searchRegex }
      ]
    })
      .select("_id")
      .lean();

    filter.$or = [
      { invitationReference: searchRegex },
      {
        projectId: {
          $in: matchingProjects.map(
            (project) => project._id
          )
        }
      }
    ];
  }

  const [invitations, total] = await Promise.all([
    ReviewInvitation.find(filter)
      .populate(
        "projectId",
        "projectReference title status completedAt clientSnapshot"
      )
      .populate(
        "clientId",
        "fullName email phone"
      )
      .populate(
        "reviewId",
        "rating status submittedAt"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    ReviewInvitation.countDocuments(filter)
  ]);

  return {
    invitations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Retrieves a single invitation for the administrator workspace.
 */
export async function getReviewInvitationById(
  invitationId: string
) {
  const id = validateObjectId(
    invitationId,
    "invitation ID"
  );

  const invitation = await ReviewInvitation.findById(id)
    .populate(
      "projectId",
      "projectReference title status completedAt clientSnapshot"
    )
    .populate(
      "clientId",
      "fullName email phone"
    )
    .populate(
      "reviewId",
      "rating comment status submittedAt"
    )
    .lean();

  if (!invitation) {
    throw new ApiError(
      404,
      "Review invitation not found."
    );
  }

  return invitation;
}

/**
 * Renews an invitation by rotating its token and expiry date.
 *
 * The previous token becomes invalid immediately.
 * Any previous outbox record is cancelled in the same transaction.
 * The raw replacement token is returned once.
 */
export async function renewReviewInvitation(
  invitationId: string,
  adminId: string,
  context: AuditContext = {}
): Promise<CreateReviewInvitationResult> {
  const id = validateObjectId(
    invitationId,
    "invitation ID"
  );

  const actorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const token = generateToken();
  const tokenHash = hashToken(token);

  const session = await mongoose.startSession();

  let renewedInvitation:
    | InstanceType<typeof ReviewInvitation>
    | undefined;

  try {
    renewedInvitation = await session.withTransaction(
      async () => {
        const invitation = await ReviewInvitation.findById(
          id
        ).session(session);

        if (!invitation) {
          throw new ApiError(
            404,
            "Review invitation not found."
          );
        }

        if (
          invitation.status === ReviewInvitationStatus.SUBMITTED
        ) {
          throw new ApiError(
            409,
            "A submitted invitation cannot be renewed."
          );
        }

        const project = await Project.findOne({
          _id: invitation.projectId,
          status: ProjectStatus.COMPLETED,
          isDeleted: false
        }).session(session);

        if (!project) {
          throw new ApiError(
            404,
            "The completed project could not be found."
          );
        }

        const existingReview = await Review.findOne({
          projectId: invitation.projectId
        }).session(session);

        if (existingReview) {
          throw new ApiError(
            409,
            "A review already exists for this project."
          );
        }

        const previousStatus = invitation.status;

        await cancelPreviousInvitationEmail(
          invitation._id,
          session
        );

        invitation.tokenHash = tokenHash;
        invitation.status = ReviewInvitationStatus.PENDING;
        invitation.sentAt = null;
        invitation.expiresAt = getExpiryDate();
        invitation.submittedAt = null;
        invitation.revokedAt = null;
        invitation.reviewId = null;

        await invitation.save({ session });

        await writeInvitationAuditLog(
          {
            actorId,
            action: "review_invitation.renewed",
            resourceId: invitation._id,
            description:
              "An administrator renewed a client review invitation.",
            changes: {
              previousStatus,
              newStatus: ReviewInvitationStatus.PENDING,
              expiresAt: invitation.expiresAt
            },
            context
          },
          session
        );

        return invitation;
      }
    );
  } finally {
    await session.endSession();
  }

  if (!renewedInvitation) {
    throw new ApiError(
      500,
      "The review invitation could not be renewed."
    );
  }

  return {
    invitation: renewedInvitation,
    token
  };
}

/**
 * Revokes an outstanding invitation.
 *
 * Any unsent email is cancelled in the same transaction.
 */
export async function revokeReviewInvitation(
  invitationId: string,
  adminId: string,
  context: AuditContext = {}
) {
  const id = validateObjectId(
    invitationId,
    "invitation ID"
  );

  const actorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  let revokedInvitation:
    | InstanceType<typeof ReviewInvitation>
    | undefined;

  try {
    revokedInvitation = await session.withTransaction(
      async () => {
        const invitation = await ReviewInvitation.findById(
          id
        ).session(session);

        if (!invitation) {
          throw new ApiError(
            404,
            "Review invitation not found."
          );
        }

        if (
          invitation.status === ReviewInvitationStatus.SUBMITTED
        ) {
          throw new ApiError(
            409,
            "A submitted invitation cannot be revoked."
          );
        }

        if (
          invitation.status === ReviewInvitationStatus.REVOKED
        ) {
          throw new ApiError(
            409,
            "This invitation has already been revoked."
          );
        }

        const previousStatus = invitation.status;

        await cancelUnsentInvitationEmail(
          invitation._id,
          session
        );

        invitation.status = ReviewInvitationStatus.REVOKED;
        invitation.revokedAt = new Date();

        await invitation.save({ session });

        await writeInvitationAuditLog(
          {
            actorId,
            action: "review_invitation.revoked",
            resourceId: invitation._id,
            description:
              "An administrator revoked a client review invitation.",
            changes: {
              previousStatus,
              newStatus: ReviewInvitationStatus.REVOKED
            },
            context
          },
          session
        );

        return invitation;
      }
    );
  } finally {
    await session.endSession();
  }

  if (!revokedInvitation) {
    throw new ApiError(
      500,
      "The review invitation could not be revoked."
    );
  }

  return revokedInvitation;
}

/**
 * Validates a public invitation token and returns safe project details.
 *
 * Expired pending invitations are marked as expired.
 * Their unsent email records are also cancelled.
 * The token hash is never returned.
 */
export async function getPublicReviewInvitation(
  token: string
) {
  if (!token || !/^[a-f\d]{64}$/i.test(token)) {
    throw new ApiError(
      400,
      "A valid review invitation token is required."
    );
  }

  const invitation = await ReviewInvitation.findOne({
    tokenHash: hashToken(token)
  });

  if (!invitation) {
    throw new ApiError(
      404,
      "This review invitation is invalid."
    );
  }

  if (
    invitation.status === ReviewInvitationStatus.REVOKED
  ) {
    throw new ApiError(
      410,
      "This review invitation has been revoked."
    );
  }

  if (
    invitation.status === ReviewInvitationStatus.SUBMITTED
  ) {
    throw new ApiError(
      409,
      "A review has already been submitted using this invitation."
    );
  }

  if (
    invitation.status === ReviewInvitationStatus.EXPIRED ||
    invitation.expiresAt.getTime() <= Date.now()
  ) {
    if (
      invitation.status !== ReviewInvitationStatus.EXPIRED
    ) {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          invitation.status = ReviewInvitationStatus.EXPIRED;

          await invitation.save({ session });

          await cancelUnsentInvitationEmail(
            invitation._id,
            session
          );
        });
      } finally {
        await session.endSession();
      }
    }

    throw new ApiError(
      410,
      "This review invitation has expired."
    );
  }

  const project = await Project.findOne({
    _id: invitation.projectId,
    clientId: invitation.clientId,
    status: ProjectStatus.COMPLETED,
    isDeleted: false
  })
    .select(
      "projectReference title clientSnapshot.fullName"
    )
    .lean();

  if (!project) {
    throw new ApiError(
      404,
      "The project associated with this invitation could not be found."
    );
  }

  return {
    invitationReference: invitation.invitationReference,
    expiresAt: invitation.expiresAt,
    project: {
      projectReference: project.projectReference,
      title: project.title,
      clientName: project.clientSnapshot.fullName
    }
  };
}

/**
 * Submits a client's review through a valid invitation.
 *
 * Review creation, invitation submission, and cancellation of any
 * unsent invitation email happen in the same transaction.
 */
export async function submitClientReview(
  input: SubmitClientReviewInput
) {
  if (
    !input.token ||
    !/^[a-f\d]{64}$/i.test(input.token)
  ) {
    throw new ApiError(
      400,
      "A valid review invitation token is required."
    );
  }

  const tokenHash = hashToken(input.token);
  const session = await mongoose.startSession();

  let submittedReview:
    | {
        id: string;
        rating: number;
        status: ReviewStatus;
        submittedAt: Date;
      }
    | undefined;

  try {
    submittedReview = await session.withTransaction(
      async () => {
        const invitation = await ReviewInvitation.findOne({
          tokenHash
        }).session(session);

        if (!invitation) {
          throw new ApiError(
            404,
            "This review invitation is invalid."
          );
        }

        if (
          invitation.status === ReviewInvitationStatus.REVOKED
        ) {
          throw new ApiError(
            410,
            "This review invitation has been revoked."
          );
        }

        if (
          invitation.status === ReviewInvitationStatus.SUBMITTED
        ) {
          throw new ApiError(
            409,
            "A review has already been submitted using this invitation."
          );
        }

        if (
          invitation.status === ReviewInvitationStatus.EXPIRED ||
          invitation.expiresAt.getTime() <= Date.now()
        ) {
          throw new ApiError(
            410,
            "This review invitation has expired."
          );
        }

        const project = await Project.findOne({
          _id: invitation.projectId,
          clientId: invitation.clientId,
          status: ProjectStatus.COMPLETED,
          isDeleted: false
        }).session(session);

        if (!project) {
          throw new ApiError(
            404,
            "The completed project could not be found."
          );
        }

        const existingReview = await Review.findOne({
          projectId: project._id
        }).session(session);

        if (existingReview) {
          throw new ApiError(
            409,
            "A review already exists for this project."
          );
        }

        const displayName = getDisplayName(
          project.clientSnapshot.fullName,
          input.displayPreference
        );

        const [review] = await Review.create(
          [
            {
              projectId: project._id,
              clientId: project.clientId,
              rating: input.rating,
              comment: input.comment.trim(),
              displayPreference: input.displayPreference,
              displayName,
              consentToPublish: input.consentToPublish,
              submissionMethod: "client",
              submittedBy: null,
              submittedAt: new Date(),
              status: ReviewStatus.PENDING,
              isFeatured: false
            }
          ],
          { session }
        );

        if (!review) {
          throw new ApiError(
            500,
            "Your review could not be submitted."
          );
        }

        const submittedAt = new Date();

        await cancelUnsentInvitationEmail(
          invitation._id,
          session
        );

        invitation.status = ReviewInvitationStatus.SUBMITTED;
        invitation.reviewId = review._id;
        invitation.submittedAt = submittedAt;

        await invitation.save({ session });

        return {
          id: review._id.toString(),
          rating: review.rating,
          status: review.status,
          submittedAt
        };
      }
    );
  } finally {
    await session.endSession();
  }

  if (!submittedReview) {
    throw new ApiError(
      500,
      "Your review could not be submitted."
    );
  }

  return submittedReview;
}
