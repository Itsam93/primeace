
import { model, Schema, type InferSchemaType } from "mongoose";

const adminSessionSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false
    },

    csrfTokenHash: {
      type: String,
      required: true,
      select: false
    },

    expiresAt: {
      type: Date,
      required: true
    },

    revokedAt: {
      type: Date,
      default: null
    },

    lastUsedAt: {
      type: Date,
      default: Date.now
    },

    ipAddress: {
      type: String,
      default: null
    },

    userAgent: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

adminSessionSchema.index({
  adminId: 1,
  revokedAt: 1,
  expiresAt: 1
});

export type AdminSessionDocument = InferSchemaType<
  typeof adminSessionSchema
>;

export const AdminSession = model(
  "AdminSession",
  adminSessionSchema
);
