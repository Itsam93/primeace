import {
  model,
  Schema,
  Types
} from "mongoose";

import { softDeleteFields } from "../../database/softDelete.js";

export interface ProjectCategoryRecord {
  name: string;
  slug: string;
  description: string | null;

  isActive: boolean;
  sortOrder: number;

  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const projectCategorySchema = new Schema<ProjectCategoryRecord>(
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
      default: null,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    sortOrder: {
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

projectCategorySchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false
    }
  }
);

projectCategorySchema.index({
  isActive: 1,
  isDeleted: 1,
  sortOrder: 1,
  name: 1
});

export const ProjectCategory = model<ProjectCategoryRecord>(
  "ProjectCategory",
  projectCategorySchema
);
