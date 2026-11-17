import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import { NotificationStatus } from "@primeace/shared";

const notificationSchema = new Schema(
  {
    channel: {
      type: String,
      enum: ["email"],
      default: "email",
      required: true
    },

    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    resourceType: {
      type: String,
      enum: [
        "service_request",
        "quotation",
        "contract",
        "project",
        "review",
        "system"
      ],
      required: true
    },

    resourceId: {
      type: Schema.Types.ObjectId,
      default: null
    },

    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING,
      required: true,
      index: true
    },

    providerMessageId: {
      type: String,
      default: null
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0
    },

    lastAttemptAt: {
      type: Date,
      default: null
    },

    sentAt: {
      type: Date,
      default: null
    },

    deliveredAt: {
      type: Date,
      default: null
    },

    failureReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

notificationSchema.index({
  status: 1,
  createdAt: 1
});

notificationSchema.index({
  resourceType: 1,
  resourceId: 1,
  createdAt: -1
});

export type NotificationDocument =
  InferSchemaType<typeof notificationSchema>;

export const Notification = model(
  "Notification",
  notificationSchema
);
