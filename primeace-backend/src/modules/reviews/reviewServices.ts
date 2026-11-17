import mongoose, { Types } from "mongoose";

import {
  ProjectStatus,
  ReviewStatus
} from "@primeace/shared";

import type {
  IPublicReview
} from "@primeace/shared";

import { ApiError } from "../../shared/errors/ApiError.js";
import { AuditLog } from "../audit/Auditlog.js";
import { Project } from "../projects/Project.js";
import { Review } from "./Review.js";

interface AuditContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface CreateAdminReviewInput {
  projectId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  displayPreference: "full_name" | "first_name" | "anonymous";
  consentToPublish: boolean;
}

interface ListReviewsInput {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  status?: ReviewStatus | undefined;
  submissionMethod?: "client" | "admin" | undefined;
}

interface ModerateReviewInput {
  status: Exclude<ReviewStatus, ReviewStatus.PENDING>;
  isFeatured?: boolean | undefined;
  moderationNote?: string | null | undefined;
}

interface ReviewAuditInput {
  actorId: Types.ObjectId;
  action: string;
  resourceId: Types.ObjectId;
  description: string;
  changes?: Record<string, unknown> | undefined;
  context?: AuditContext | undefined;
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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDisplayName(
  fullName: string,
  preference: CreateAdminReviewInput["displayPreference"]
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

async function writeAuditLog(
  input: ReviewAuditInput,
  session: mongoose.ClientSession
): Promise<void> {
  await AuditLog.create(
    [
      {
        actorId: input.actorId,
        action: input.action,
        resourceType: "review",
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
 * Returns completed projects that do not already have a review.
 * Deleted projects are excluded.
 */
export async function getEligibleReviewProjects() {
  const reviewedProjectIds = await Review.distinct("projectId");

  return Project.find({
    status: ProjectStatus.COMPLETED,
    isDeleted: false,
    _id: { $nin: reviewedProjectIds }
  })
    .select(
      "_id projectReference title clientId clientSnapshot completedAt"
    )
    .sort({ completedAt: -1, createdAt: -1 })
    .lean();
}

/**
 * Creates a review entered by an administrator.
 *
 * Administrator-entered reviews:
 * - Must belong to a completed, non-deleted project.
 * - Must have explicit client publication consent.
 * - Are always created as pending.
 * - Are never featured automatically.
 * - Do not trigger an email.
 */
export async function createAdminReview(
  input: CreateAdminReviewInput,
  adminId: string,
  context: AuditContext = {}
) {
  const projectId = validateObjectId(input.projectId, "project ID");
  const actorId = validateObjectId(adminId, "administrator ID");

  if (input.consentToPublish !== true) {
    throw new ApiError(
      400,
      "Explicit client consent to publish the review is required."
    );
  }

  const session = await mongoose.startSession();

  let createdReview: InstanceType<typeof Review> | null = null;

  try {
    await session.withTransaction(async () => {
      const project = await Project.findOne({
        _id: projectId,
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
        projectId
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
            projectId,
            clientId: project.clientId,
            rating: input.rating,
            comment: input.comment.trim(),
            displayPreference: input.displayPreference,
            displayName,
            consentToPublish: true,
            submissionMethod: "admin",
            submittedBy: actorId,
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
          "The review could not be created."
        );
      }

      await writeAuditLog(
        {
          actorId,
          action: "review.created",
          resourceId: review._id,
          description:
            "An administrator entered a client review for moderation.",
          changes: {
            projectId: projectId.toString(),
            rating: input.rating,
            submissionMethod: "admin",
            status: ReviewStatus.PENDING,
            consentToPublish: true
          },
          context
        },
        session
      );

      createdReview = review;
    });
  } finally {
    await session.endSession();
  }

  if (!createdReview) {
    throw new ApiError(
      500,
      "The review could not be created."
    );
  }

  return createdReview;
}

/**
 * Lists reviews for the administrator workspace.
 */
export async function getReviews(
  input: ListReviewsInput = {}
) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  const filter: Record<string, unknown> = {};

  if (input.status) {
    filter.status = input.status;
  }

  if (input.submissionMethod) {
    filter.submissionMethod = input.submissionMethod;
  }

  if (input.search?.trim()) {
    const searchRegex = new RegExp(
      escapeRegex(input.search.trim()),
      "i"
    );

    filter.$or = [
      { comment: searchRegex },
      { displayName: searchRegex }
    ];
  }

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate(
        "projectId",
        "projectReference title status"
      )
      .populate(
        "clientId",
        "fullName email phone"
      )
      .populate(
        "submittedBy",
        "fullName email"
      )
      .populate(
        "moderatedBy",
        "fullName email"
      )
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Review.countDocuments(filter)
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Retrieves a single review for the administrator workspace.
 */
export async function getReviewById(reviewId: string) {
  const id = validateObjectId(reviewId, "review ID");

  const review = await Review.findById(id)
    .populate(
      "projectId",
      "projectReference title status"
    )
    .populate(
      "clientId",
      "fullName email phone"
    )
    .populate(
      "submittedBy",
      "fullName email"
    )
    .populate(
      "moderatedBy",
      "fullName email"
    )
    .lean();

  if (!review) {
    throw new ApiError(404, "Review not found.");
  }

  return review;
}

/**
 * Moderates a review and optionally changes its featured status.
 */
export async function moderateReview(
  reviewId: string,
  input: ModerateReviewInput,
  adminId: string,
  context: AuditContext = {}
) {
  const id = validateObjectId(reviewId, "review ID");
  const actorId = validateObjectId(adminId, "administrator ID");

  const session = await mongoose.startSession();

  let moderatedReview: InstanceType<typeof Review> | null = null;

  try {
    await session.withTransaction(async () => {
      const review = await Review.findById(id).session(session);

      if (!review) {
        throw new ApiError(404, "Review not found.");
      }

      const previousStatus = review.status;
      const previousFeatured = review.isFeatured;

      if (
        input.status === ReviewStatus.APPROVED &&
        !review.consentToPublish
      ) {
        throw new ApiError(
          400,
          "This review cannot be approved without explicit publication consent."
        );
      }

      if (
        input.isFeatured === true &&
        (
          input.status !== ReviewStatus.APPROVED ||
          !review.consentToPublish
        )
      ) {
        throw new ApiError(
          400,
          "Only approved reviews with publication consent can be featured."
        );
      }

      review.status = input.status;

      if (input.isFeatured !== undefined) {
        review.isFeatured = input.isFeatured;
      }

      if (input.status !== ReviewStatus.APPROVED) {
        review.isFeatured = false;
      }

      if (input.moderationNote !== undefined) {
        review.moderationNote =
          input.moderationNote?.trim() || null;
      }

      review.moderatedAt = new Date();
      review.moderatedBy = actorId;

      await review.save({ session });

      await writeAuditLog(
        {
          actorId,
          action: "review.moderated",
          resourceId: review._id,
          description: "An administrator moderated a client review.",
          changes: {
            previousStatus,
            newStatus: review.status,
            previousFeatured,
            newFeatured: review.isFeatured,
            moderationNote: review.moderationNote
          },
          context
        },
        session
      );

      moderatedReview = review;
    });
  } finally {
    await session.endSession();
  }

  if (!moderatedReview) {
    throw new ApiError(
      500,
      "The review could not be moderated."
    );
  }

  return moderatedReview;
}

/**
 * Returns reviews approved for public display and explicitly featured.
 * Only public-safe fields are returned.
 */
export async function getFeaturedReviews(): Promise<IPublicReview[]> {
  const reviews = await Review.find({
    status: ReviewStatus.APPROVED,
    consentToPublish: true,
    isFeatured: true
  })
    .select(
      "_id rating comment displayName displayPreference createdAt"
    )
    .sort({ createdAt: -1 })
    .lean();

  return reviews.map((review) => ({
    id: review._id.toString(),
    rating: review.rating as IPublicReview["rating"],
    comment: review.comment,
    displayName:
      review.displayName?.trim() ||
      (
        review.displayPreference === "anonymous"
          ? "Anonymous Client"
          : "Client"
      ),
    createdAt: review.createdAt.toISOString()
  }));
}
