import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import {
  ReviewInvitationStatus
} from "@primeace/shared";

const reviewInvitationSchema = new Schema(
  {
    invitationReference: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true
    },

    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true
    },

    reviewId: {
      type: Schema.Types.ObjectId,
      ref: "Review",
      default: null
    },

    status: {
      type: String,
      enum: Object.values(ReviewInvitationStatus),
      default: ReviewInvitationStatus.PENDING,
      required: true,
      index: true
    },

    sentAt: {
      type: Date,
      default: null
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    submittedAt: {
      type: Date,
      default: null
    },

    revokedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

reviewInvitationSchema.index({
  status: 1,
  expiresAt: 1
});

export type ReviewInvitationDocument =
  InferSchemaType<typeof reviewInvitationSchema>;

export const ReviewInvitation = model(
  "ReviewInvitation",
  reviewInvitationSchema
);
