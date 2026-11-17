import { Schema, Types } from "mongoose";

export interface SoftDeleteFields {
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: Types.ObjectId | null;
}

export const softDeleteFields = {
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  deletedAt: {
    type: Date,
    default: null
  },

  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: "Admin",
    default: null
  }
};