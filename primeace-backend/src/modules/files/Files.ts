import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import { softDeleteFields } from "../../database/softDelete.js";

const fileSchema = new Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true
    },

    mimeType: {
      type: String,
      required: true,
      trim: true
    },

    sizeBytes: {
      type: Number,
      required: true,
      min: 1
    },

    format: {
      type: String,
      required: true,
      lowercase: true
    },

    storageProvider: {
      type: String,
      enum: ["cloudinary"],
      default: "cloudinary",
      required: true
    },

    cloudinaryPublicId: {
      type: String,
      required: true,
      unique: true,
      select: false
    },

    cloudinaryAssetId: {
      type: String,
      default: null,
      select: false
    },

    resourceType: {
      type: String,
      enum: ["image", "raw", "video"],
      required: true
    },

    purpose: {
      type: String,
      enum: [
        "service_request",
        "project_deliverable",
        "contract",
        "accepted_contract",
        "academic_reference",
        "other"
      ],
      required: true
    },

    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true
    },

    serviceRequestId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceRequest",
      default: null,
      index: true
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true
    },

    uploadedByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },

    ...softDeleteFields
  },
  {
    timestamps: true,
    versionKey: false
  }
);

fileSchema.index({
  clientId: 1,
  createdAt: -1
});

export type FileDocument = InferSchemaType<typeof fileSchema>;

export const File = model("File", fileSchema);
