import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

const auditLogSchema = new Schema(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },

    action: {
      type: String,
      required: true,
      trim: true
    },

    resourceType: {
      type: String,
      required: true,
      trim: true
    },

    resourceId: {
      type: Schema.Types.ObjectId,
      required: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    changes: {
      type: Schema.Types.Mixed,
      default: null
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: null
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
    timestamps: {
      createdAt: true,
      updatedAt: false
    },
    versionKey: false
  }
);

auditLogSchema.index({
  resourceType: 1,
  resourceId: 1,
  createdAt: -1
});

auditLogSchema.index({
  actorId: 1,
  createdAt: -1
});

export type AuditLogDocument =
  InferSchemaType<typeof auditLogSchema>;

export const AuditLog = model("AuditLog", auditLogSchema);
