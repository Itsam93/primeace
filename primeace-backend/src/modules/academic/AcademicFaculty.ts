import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import { softDeleteFields } from "../../database/softDelete.js";

const academicFacultySchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicInstitution",
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

academicFacultySchema.index(
  { institutionId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false
    }
  }
);

export type AcademicFacultyDocument =
  InferSchemaType<typeof academicFacultySchema>;

export const AcademicFaculty = model(
  "AcademicFaculty",
  academicFacultySchema
);
