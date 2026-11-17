import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import { softDeleteFields } from "../../database/softDelete.js";

const academicDepartmentSchema = new Schema(
  {
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicFaculty",
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

academicDepartmentSchema.index(
  { facultyId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false
    }
  }
);

export type AcademicDepartmentDocument =
  InferSchemaType<typeof academicDepartmentSchema>;

export const AcademicDepartment = model(
  "AcademicDepartment",
  academicDepartmentSchema
);
