import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import { softDeleteFields } from "../../database/softDelete.js";

const academicTopicSchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicInstitution",
      default: null,
      index: true
    },

    facultyId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicFaculty",
      default: null,
      index: true
    },

    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicDepartment",
      default: null,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: null,
      trim: true
    },

    academicLevels: {
      type: [String],
      enum: [
        "ND",
        "HND",
        "undergraduate",
        "PGD",
        "masters",
        "phd",
        "other"
      ],
      default: []
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

academicTopicSchema.index({
  institutionId: 1,
  facultyId: 1,
  departmentId: 1,
  isActive: 1
});

academicTopicSchema.index({
  title: "text",
  description: "text"
});

export type AcademicTopicDocument =
  InferSchemaType<typeof academicTopicSchema>;

export const AcademicTopic = model(
  "AcademicTopic",
  academicTopicSchema
);
