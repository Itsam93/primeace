import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import { softDeleteFields } from "../../database/softDelete.js";

const clientSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true
    },

    normalizedEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    normalizedPhone: {
      type: String,
      required: true,
      trim: true
    },

    organisation: {
      type: String,
      default: null,
      trim: true
    },

    ...softDeleteFields
  },
  {
    timestamps: true,
    versionKey: false
  }
);

clientSchema.index(
  { normalizedEmail: 1 },
  {
    unique: true,
    partialFilterExpression: {
      normalizedEmail: { $type: "string" },
      isDeleted: false
    }
  }
);

clientSchema.index({
  normalizedPhone: 1,
  isDeleted: 1
});

export type ClientDocument = InferSchemaType<typeof clientSchema>;

export const Client = model("Client", clientSchema);