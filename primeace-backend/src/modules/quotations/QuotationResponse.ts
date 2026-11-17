import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

const quotationResponseSchema = new Schema(
  {
    quotationId: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
      required: true
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

    response: {
      type: String,
      enum: [
        "approved",
        "declined",
        "revision_requested"
      ],
      required: true
    },

    comments: {
      type: String,
      default: null,
      trim: true,
      maxlength: 5000
    },

    accessTokenId: {
      type: Schema.Types.ObjectId,
      ref: "QuotationAccessToken",
      required: true
    },

    respondedAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

quotationResponseSchema.index(
  {
    quotationId: 1,
    quotationVersion: 1
  },
  {
    unique: true
  }
);

quotationResponseSchema.index({
  quotationId: 1,
  respondedAt: -1
});

export type QuotationResponseDocument =
  InferSchemaType<typeof quotationResponseSchema>;

export const QuotationResponse = model(
  "QuotationResponse",
  quotationResponseSchema
);
