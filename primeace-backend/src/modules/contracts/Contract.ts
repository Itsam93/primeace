import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import { ContractStatus } from "@primeace/shared";

const contractItemSchema = new Schema(
  {
    serviceName: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    deliverables: {
      type: [String],
      default: []
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    unitAmountKobo: {
      type: Number,
      required: true,
      min: 0
    },

    totalAmountKobo: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);

const contractSchema = new Schema(
  {
    contractNumber: {
      type: String,
      required: true,
      trim: true
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
      required: true,
      index: true
    },

    quotationId: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
      required: true,
      index: true
    },

    quotationNumber: {
      type: String,
      required: true,
      trim: true
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null
    },

    version: {
      type: Number,
      required: true,
      min: 1
    },

    previousVersionId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      default: null
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    scope: {
      type: String,
      required: true,
      trim: true
    },

    items: {
      type: [contractItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "A contract must contain at least one item."
      }
    },

    deliverables: {
      type: [String],
      default: []
    },

    contractAmountKobo: {
      type: Number,
      required: true,
      min: 0
    },

    terms: {
      type: [String],
      required: true,
      default: []
    },

    startDate: {
      type: Date,
      default: null
    },

    expectedCompletionDate: {
      type: Date,
      default: null
    },

    status: {
      type: String,
      enum: Object.values(ContractStatus),
      default: ContractStatus.DRAFT,
      required: true,
      index: true
    },

    issuedAt: {
      type: Date,
      default: null
    },

    acceptanceDeadline: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

contractSchema.index(
  { contractNumber: 1, version: 1 },
  { unique: true }
);

contractSchema.index(
  { quotationId: 1, version: 1 },
  { unique: true }
);

contractSchema.index(
  { previousVersionId: 1 },
  { sparse: true }
);

export type ContractDocument =
  InferSchemaType<typeof contractSchema>;

export const Contract = model(
  "Contract",
  contractSchema
);
