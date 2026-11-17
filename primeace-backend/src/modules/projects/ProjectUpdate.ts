import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

const projectUpdateSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    isClientVisible: {
      type: Boolean,
      default: false
    },

    sentToClientAt: {
      type: Date,
      default: null
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

projectUpdateSchema.index({
  projectId: 1,
  createdAt: -1
});

export type ProjectUpdateDocument =
  InferSchemaType<typeof projectUpdateSchema>;

export const ProjectUpdate = model(
  "ProjectUpdate",
  projectUpdateSchema
);
