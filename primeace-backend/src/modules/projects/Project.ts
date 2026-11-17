import {
  model,
  Schema,
  Types
} from "mongoose";

import {
  ProjectSource,
  ProjectStatus
} from "@primeace/shared";

import { softDeleteFields } from "../../database/softDelete.js";

export interface ProjectRecord {
  projectReference: string;

  source: ProjectSource;

  clientId: Types.ObjectId;

  clientSnapshot: {
    fullName: string;
    email: string | null;
    phone: string;
  };

  serviceRequestId: Types.ObjectId | null;
  quotationId: Types.ObjectId | null;
  contractId: Types.ObjectId | null;

  serviceNames: string[];

  title: string;
  description: string;

  contractAmountKobo: number | null;

  status: ProjectStatus;

  startDate: Date | null;
  expectedCompletionDate: Date | null;
  completedAt: Date | null;

  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<ProjectRecord>(
  {
    projectReference: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    source: {
      type: String,
      enum: Object.values(ProjectSource),
      required: true,
      default: ProjectSource.CONTRACT,
      index: true
    },

    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true
    },

    clientSnapshot: {
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

      phone: {
        type: String,
        required: true,
        trim: true
      }
    },

    serviceRequestId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceRequest",
      default: null
    },

    quotationId: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
      default: null
    },

    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      default: null
    },

    serviceNames: {
      type: [String],
      default: []
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    contractAmountKobo: {
      type: Number,
      default: null,
      min: 0
    },

    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.NOT_STARTED,
      required: true,
      index: true
    },

    startDate: {
      type: Date,
      default: null
    },

    expectedCompletionDate: {
      type: Date,
      default: null
    },

    completedAt: {
      type: Date,
      default: null
    },

    ...softDeleteFields
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// A contract can generate only one project.
// Historical projects can have a null contractId.
projectSchema.index(
  { contractId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      contractId: { $type: "objectId" }
    }
  }
);

projectSchema.index({
  clientId: 1,
  createdAt: -1
});

projectSchema.index({
  status: 1,
  expectedCompletionDate: 1
});

export const Project = model<ProjectRecord>(
  "Project",
  projectSchema
);
