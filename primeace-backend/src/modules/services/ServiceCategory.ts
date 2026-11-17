import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import { softDeleteFields } from "../../database/softDelete.js";

const serviceCategorySchema = new Schema(
  {
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

    description: {
      type: String,
      required: true,
      trim: true
    },

    displayOrder: {
      type: Number,
      required: true,
      default: 0,
      min: 0
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

serviceCategorySchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false
    }
  }
);

export type ServiceCategoryDocument =
  InferSchemaType<typeof serviceCategorySchema>;

export const ServiceCategory = model(
  "ServiceCategory",
  serviceCategorySchema
);