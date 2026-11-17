import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import { softDeleteFields } from "../../database/softDelete.js";

const academicInstitutionSchema = new Schema(
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

academicInstitutionSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false
    }
  }
);

export type AcademicInstitutionDocument =
  InferSchemaType<typeof academicInstitutionSchema>;

export const AcademicInstitution = model(
  "AcademicInstitution",
  academicInstitutionSchema
);
