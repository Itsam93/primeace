import { Types } from "mongoose";

import { ProjectStatus, ReviewInvitationStatus } from "@primeace/shared";

import { ApiError } from "../../shared/errors/ApiError.js";
import { sendEmail } from "../../services/email.service.js";
import { Project } from "../projects/Project.js";
import { ReviewInvitation } from "./ReviewInvitation.js";
import { buildReviewInvitationEmail } from "./reviewInvitation.email.js";

interface DeliverReviewInvitationInput {
  invitationId: Types.ObjectId | string;
  token: string;
}

interface DeliverReviewInvitationResult {
  sentAt: Date;
}

export async function deliverReviewInvitation(
  input: DeliverReviewInvitationInput
): Promise<DeliverReviewInvitationResult> {
  const invitation = await ReviewInvitation.findOne({
    _id: input.invitationId,
    status: ReviewInvitationStatus.PENDING
  });

  if (!invitation) {
    throw new ApiError(
      404,
      "The pending review invitation could not be found."
    );
  }

  if (invitation.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(
      410,
      "The review invitation has expired. Renew it before sending."
    );
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
      "The completed project associated with this invitation could not be found."
    );
  }

  const recipientEmail = project.clientSnapshot.email?.trim();

  if (!recipientEmail) {
    throw new ApiError(
      400,
      "The client does not have an email address recorded for this project."
    );
  }

  const email = buildReviewInvitationEmail({
    clientName: project.clientSnapshot.fullName,
    projectReference: project.projectReference,
    token: input.token,
    expiresAt: invitation.expiresAt
  });

  await sendEmail({
    to: recipientEmail,
    subject: email.subject,
    html: email.html,
    text: email.text
  });

  const sentAt = new Date();

  const updatedInvitation =
    await ReviewInvitation.findOneAndUpdate(
      {
        _id: invitation._id,
        status: ReviewInvitationStatus.PENDING,
        expiresAt: { $gt: sentAt }
      },
      {
        $set: { sentAt }
      },
      {
        new: true
      }
    );

  if (!updatedInvitation) {
    throw new ApiError(
      409,
      "The email was accepted, but the invitation could not be updated. Check its current status before attempting another send."
    );
  }

  return { sentAt };
}
