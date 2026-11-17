import { createHash } from "node:crypto";
import { Types } from "mongoose";

import {
  ProjectStatus,
  ReviewInvitationStatus
} from "@primeace/shared";

import { ApiError } from "../../shared/errors/ApiError.js";
import { sendEmail } from "../../services/email.service.js";

import { Project } from "../projects/Project.js";
import { ReviewInvitation } from "./ReviewInvitation.js";
import { ReviewEmailOutbox } from "./ReviewEmailOutbox.js";

import {
  decryptReviewInvitationToken,
  encryptReviewInvitationToken
} from "./reviewInvitation.crypto.js";

import { buildReviewInvitationEmail } from "./reviewInvitation.email.js";

interface QueueReviewInvitationEmailInput {
  invitationId: Types.ObjectId | string;
  token: string;
}

interface ReviewEmailDeliveryResult {
  sent: boolean;
  sentAt: Date | null;
  message: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Unable to send the review invitation email.";
}

async function cancelOutboxEmail(
  outboxId: Types.ObjectId,
  message: string
): Promise<ReviewEmailDeliveryResult> {
  await ReviewEmailOutbox.updateOne(
    {
      _id: outboxId,
      status: "sending"
    },
    {
      $set: {
        status: "cancelled",
        encryptedToken: null,
        iv: null,
        authTag: null,
        lastError: message
      }
    }
  );

  return {
    sent: false,
    sentAt: null,
    message
  };
}

/**
 * Creates or replaces the email outbox record for an invitation.
 *
 * This is used when an invitation is first created or renewed.
 * Renewal replaces the previously stored encrypted token.
 */
export async function queueReviewInvitationEmail(
  input: QueueReviewInvitationEmailInput
): Promise<void> {
  if (!Types.ObjectId.isValid(input.invitationId)) {
    throw new ApiError(400, "Invalid review invitation ID.");
  }

  const invitation = await ReviewInvitation.findOne({
    _id: input.invitationId,
    status: ReviewInvitationStatus.PENDING,
    expiresAt: { $gt: new Date() }
  }).select("+tokenHash");

  if (!invitation) {
    throw new ApiError(
      404,
      "The review invitation was not found or is no longer valid."
    );
  }

  if (invitation.tokenHash !== hashToken(input.token)) {
    throw new ApiError(400, "The review invitation token is invalid.");
  }

  const project = await Project.findOne({
    _id: invitation.projectId,
    clientId: invitation.clientId,
    status: ProjectStatus.COMPLETED,
    isDeleted: false
  }).select(
    "projectReference clientSnapshot.fullName clientSnapshot.email"
  );

  if (!project) {
    throw new ApiError(
      404,
      "The associated completed project was not found."
    );
  }

  const recipientEmail = project.clientSnapshot.email?.trim();
  const clientName = project.clientSnapshot.fullName?.trim();

  if (!recipientEmail) {
    throw new ApiError(
      400,
      "The client does not have an email address."
    );
  }

  if (!clientName) {
    throw new ApiError(
      400,
      "The client name is required to send the invitation."
    );
  }

  const encrypted = encryptReviewInvitationToken(input.token);

  await ReviewEmailOutbox.findOneAndUpdate(
    {
      invitationId: invitation._id
    },
    {
      $set: {
        recipientEmail,
        clientName,
        projectReference: project.projectReference,
        encryptedToken: encrypted.encryptedToken,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        status: "pending",
        attempts: 0,
        lastAttemptAt: null,
        sentAt: null,
        lastError: null
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
}

/**
 * Attempts to deliver an existing queued invitation email.
 *
 * The atomic status change to "sending" prevents concurrent
 * requests from claiming the same outbox record.
 */
export async function sendQueuedReviewInvitationEmail(
  invitationId: Types.ObjectId | string
): Promise<ReviewEmailDeliveryResult> {
  if (!Types.ObjectId.isValid(invitationId)) {
    throw new ApiError(400, "Invalid review invitation ID.");
  }

  const outbox = await ReviewEmailOutbox.findOneAndUpdate(
    {
      invitationId,
      status: {
        $in: ["pending", "failed"]
      }
    },
    {
      $set: {
        status: "sending",
        lastAttemptAt: new Date(),
        lastError: null
      },
      $inc: {
        attempts: 1
      }
    },
    {
      new: true
    }
  ).select("+encryptedToken +iv +authTag");

  if (!outbox) {
    const existingOutbox = await ReviewEmailOutbox.findOne({
      invitationId
    });

    if (!existingOutbox) {
      throw new ApiError(
        404,
        "No queued email was found for this invitation."
      );
    }

    if (existingOutbox.status === "sent") {
      return {
        sent: true,
        sentAt: existingOutbox.sentAt ?? null,
        message: "The invitation email has already been sent."
      };
    }

    if (existingOutbox.status === "sending") {
      throw new ApiError(
        409,
        "The invitation email is already being processed."
      );
    }

    if (existingOutbox.status === "cancelled") {
      throw new ApiError(
        409,
        "The invitation email has been cancelled."
      );
    }

    throw new ApiError(
      409,
      "The invitation email cannot currently be sent."
    );
  }

  let token: string;
  let expiresAt: Date;

  try {
    if (
      !outbox.encryptedToken ||
      !outbox.iv ||
      !outbox.authTag
    ) {
      throw new ApiError(
        500,
        "The encrypted invitation token is unavailable."
      );
    }

    token = decryptReviewInvitationToken({
      encryptedToken: outbox.encryptedToken,
      iv: outbox.iv,
      authTag: outbox.authTag
    });

    const invitation = await ReviewInvitation.findById(
      invitationId
    ).select("+tokenHash");

    if (!invitation) {
      return cancelOutboxEmail(
        outbox._id,
        "The review invitation no longer exists."
      );
    }

    if (invitation.status !== ReviewInvitationStatus.PENDING) {
      return cancelOutboxEmail(
        outbox._id,
        "The review invitation is no longer pending."
      );
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      return cancelOutboxEmail(
        outbox._id,
        "The review invitation has expired."
      );
    }

    if (invitation.tokenHash !== hashToken(token)) {
      return cancelOutboxEmail(
        outbox._id,
        "The review invitation token has changed. This email has been cancelled."
      );
    }

    expiresAt = invitation.expiresAt;

    /*
     * Confirm that this delivery attempt still owns an active
     * outbox record. Renewal, revocation, or submission may have
     * cancelled the record after it was claimed.
     */
    const activeOutbox = await ReviewEmailOutbox.exists({
      _id: outbox._id,
      status: "sending"
    });

    if (!activeOutbox) {
      return {
        sent: false,
        sentAt: null,
        message: "The invitation email is no longer queued for delivery."
      };
    }

    /*
     * Re-check the invitation immediately before calling the
     * email provider to avoid sending a stale invitation token.
     */
    const currentInvitation = await ReviewInvitation.findById(
      invitationId
    ).select("+tokenHash");

    if (
      !currentInvitation ||
      currentInvitation.status !== ReviewInvitationStatus.PENDING ||
      currentInvitation.expiresAt.getTime() <= Date.now() ||
      currentInvitation.tokenHash !== hashToken(token)
    ) {
      return cancelOutboxEmail(
        outbox._id,
        "The review invitation is no longer valid. This email has been cancelled."
      );
    }

    expiresAt = currentInvitation.expiresAt;

    const email = buildReviewInvitationEmail({
      clientName: outbox.clientName,
      projectReference: outbox.projectReference,
      token,
      expiresAt
    });

    await sendEmail({
      to: outbox.recipientEmail,
      subject: email.subject,
      html: email.html,
      text: email.text
    });
  } catch (error) {
    const errorMessage = getSafeErrorMessage(error);

    await ReviewEmailOutbox.updateOne(
      {
        _id: outbox._id,
        status: "sending"
      },
      {
        $set: {
          status: "failed",
          lastError: errorMessage
        }
      }
    );

    return {
      sent: false,
      sentAt: null,
      message: errorMessage
    };
  }

  /*
   * The email provider has accepted the email at this point.
   *
   * These database updates are deliberately outside the delivery
   * try/catch. If persistence fails, the outbox must not be changed
   * to "failed", because that could cause a duplicate email retry.
   */

  const sentAt = new Date();

  const updatedOutbox = await ReviewEmailOutbox.findOneAndUpdate(
    {
      _id: outbox._id,
      status: "sending"
    },
    {
      $set: {
        status: "sent",
        sentAt,
        lastError: null,
        encryptedToken: null,
        iv: null,
        authTag: null
      }
    },
    {
      new: true
    }
  );

  if (!updatedOutbox) {
    throw new ApiError(
      500,
      "The email was accepted, but its delivery record could not be updated."
    );
  }

  await ReviewInvitation.updateOne(
    {
      _id: invitationId,
      status: ReviewInvitationStatus.PENDING
    },
    {
      $set: {
        sentAt
      }
    }
  );

  return {
    sent: true,
    sentAt,
    message: "The invitation email was sent successfully."
  };
}

/**
 * Queues an invitation email and immediately attempts delivery.
 *
 * A failed delivery does not undo invitation creation.
 * The encrypted token remains available for a later retry.
 */
export async function queueAndSendReviewInvitationEmail(
  input: QueueReviewInvitationEmailInput
): Promise<ReviewEmailDeliveryResult> {
  await queueReviewInvitationEmail(input);

  return sendQueuedReviewInvitationEmail(input.invitationId);
}
