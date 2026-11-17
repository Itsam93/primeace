import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import { softDeleteFields } from "../../database/softDelete.js";

export const ADMIN_ROLES = ["SUPER_ADMIN"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

const adminSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true
    },

    passwordHash: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ADMIN_ROLES,
      default: "SUPER_ADMIN",
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    ...softDeleteFields
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type AdminDocument = InferSchemaType<typeof adminSchema>;

export const Admin = model("Admin", adminSchema);
