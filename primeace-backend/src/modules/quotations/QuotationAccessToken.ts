import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

const quotationAccessTokenSchema = new Schema(
  {
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

    quotationVersion: {
      type: Number,
      required: true,
      min: 1
    },

    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    revokedAt: {
      type: Date,
      default: null
    },

    lastAccessedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

quotationAccessTokenSchema.index({
  quotationId: 1,
  quotationVersion: 1,
  createdAt: -1
});

quotationAccessTokenSchema.index({
  clientId: 1,
  createdAt: -1
});

export type QuotationAccessTokenDocument =
  InferSchemaType<typeof quotationAccessTokenSchema>;

export const QuotationAccessToken = model(
  "QuotationAccessToken",
  quotationAccessTokenSchema
);
