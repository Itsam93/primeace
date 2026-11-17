import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import { QuotationStatus } from "@primeace/shared";

const quotationItemSchema = new Schema(
  {
    serviceRequestItemId: {
      type: Schema.Types.ObjectId,
      default: null
    },

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
    _id: true
  }
);

const quotationSchema = new Schema(
  {
    quotationNumber: {
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
      fullName: { type: String, required: true },
      email: { type: String, default: null },
      phone: { type: String, required: true }
    },

    serviceRequestId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true
    },

    serviceRequestReference: {
      type: String,
      required: true
    },

    version: {
      type: Number,
      required: true,
      min: 1
    },

    previousVersionId: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
      default: null
    },

    items: {
      type: [quotationItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "A quotation must contain at least one item."
      }
    },

    subtotalKobo: {
      type: Number,
      required: true,
      min: 0
    },

    discountKobo: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    totalAmountKobo: {
      type: Number,
      required: true,
      min: 0
    },

    scope: {
      type: String,
      required: true,
      trim: true
    },

    terms: {
      type: [String],
      default: []
    },

    validUntil: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: Object.values(QuotationStatus),
      default: QuotationStatus.DRAFT,
      required: true,
      index: true
    },

    issuedAt: {
      type: Date,
      default: null
    },

    respondedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

quotationSchema.index(
  { quotationNumber: 1, version: 1 },
  { unique: true }
);

quotationSchema.index({
  serviceRequestId: 1,
  createdAt: -1
});

export type QuotationDocument =
  InferSchemaType<typeof quotationSchema>;

export const Quotation = model("Quotation", quotationSchema);
