import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

const serviceRequestNoteSchema = new Schema(
  {
    serviceRequestId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true
    },

    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },

    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

serviceRequestNoteSchema.index({
  serviceRequestId: 1,
  createdAt: -1
});

serviceRequestNoteSchema.index({
  adminId: 1,
  createdAt: -1
});

export type ServiceRequestNoteDocument =
  InferSchemaType<typeof serviceRequestNoteSchema>;

export const ServiceRequestNote = model(
  "ServiceRequestNote",
  serviceRequestNoteSchema
);
