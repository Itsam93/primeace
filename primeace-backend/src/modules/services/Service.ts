import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import { softDeleteFields } from "../../database/softDelete.js";

const serviceSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    deliverables: {
      type: [String],
      default: []
    },

    isActive: {
      type: Boolean,
      default: true
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0
    },

    ...softDeleteFields
  },
  {
    timestamps: true,
    versionKey: false
  }
);

serviceSchema.index(
  { categoryId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false
    }
  }
);

export type ServiceDocument = InferSchemaType<typeof serviceSchema>;

export const Service = model("Service", serviceSchema);