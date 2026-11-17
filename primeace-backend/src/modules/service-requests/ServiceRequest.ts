import {
  model,
  Schema,
  Types
} from "mongoose";

import { RequestStatus } from "@primeace/shared";
import { softDeleteFields } from "../../database/softDelete.js";

export interface ServiceRequestItem {
  serviceId: Types.ObjectId;
  serviceName: string;
  categoryId: Types.ObjectId;
  categoryName: string;
  formVersion: number;
  answers: Record<string, unknown>;
  fileIds: Types.ObjectId[];
}

export interface ServiceRequestRecord {
  reference: string;
  clientId: Types.ObjectId;

  clientSnapshot: {
    fullName: string;
    email: string | null;
    phone: string;
    organisation: string | null;
  };

  items: ServiceRequestItem[];
  status: RequestStatus;
  submittedAt: Date;

  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const serviceRequestItemSchema = new Schema<ServiceRequestItem>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true
    },

    serviceName: {
      type: String,
      required: true,
      trim: true
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: true
    },

    categoryName: {
      type: String,
      required: true,
      trim: true
    },

    formVersion: {
      type: Number,
      required: true,
      min: 1
    },

    answers: {
      type: Schema.Types.Mixed,
      required: true,
      default: {}
    },

    fileIds: {
      type: [Schema.Types.ObjectId],
      ref: "File",
      default: []
    }
  },
  {
    timestamps: true
  }
);

const serviceRequestSchema = new Schema<ServiceRequestRecord>(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
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
        lowercase: true,
        trim: true
      },

      phone: {
        type: String,
        required: true,
        trim: true
      },

      organisation: {
        type: String,
        default: null,
        trim: true
      }
    },

    items: {
      type: [serviceRequestItemSchema],
      required: true,
      validate: {
        validator: (items: ServiceRequestItem[]) =>
          items.length > 0,
        message: "A service request must contain at least one service."
      }
    },

    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.NEW,
      required: true,
      index: true
    },

    submittedAt: {
      type: Date,
      required: true,
      default: Date.now
    },

    ...softDeleteFields
  },
  {
    timestamps: true,
    versionKey: false
  }
);

serviceRequestSchema.index({
  clientId: 1,
  createdAt: -1
});

export const ServiceRequest = model<ServiceRequestRecord>(
  "ServiceRequest",
  serviceRequestSchema
);
