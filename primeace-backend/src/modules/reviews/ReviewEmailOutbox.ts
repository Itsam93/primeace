import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

const reviewEmailOutboxStatuses = [
  "pending",
  "sending",
  "sent",
  "failed",
  "cancelled"
] as const;

const reviewEmailOutboxSchema = new Schema(
  {
    invitationId: {
      type: Schema.Types.ObjectId,
      ref: "ReviewInvitation",
      required: true,
      unique: true,
      index: true
    },

    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    clientName: {
      type: String,
      required: true,
      trim: true
    },

    projectReference: {
      type: String,
      required: true,
      trim: true
    },

    encryptedToken: {
      type: String,
      default: null,
      select: false
    },

    iv: {
      type: String,
      default: null,
      select: false
    },

    authTag: {
      type: String,
      default: null,
      select: false
    },

    status: {
      type: String,
      enum: reviewEmailOutboxStatuses,
      default: "pending",
      required: true,
      index: true
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
      required: true
    },

    lastAttemptAt: {
      type: Date,
      default: null
    },

    sentAt: {
      type: Date,
      default: null
    },

    lastError: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

reviewEmailOutboxSchema.index({
  status: 1,
  updatedAt: 1
});

reviewEmailOutboxSchema.index({
  invitationId: 1,
  status: 1
});

export type ReviewEmailOutboxDocument =
  InferSchemaType<typeof reviewEmailOutboxSchema>;

export const ReviewEmailOutbox = model(
  "ReviewEmailOutbox",
  reviewEmailOutboxSchema
);
