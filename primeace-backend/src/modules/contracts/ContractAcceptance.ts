import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

const contractAcceptanceSchema = new Schema(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true
    },

    contractVersion: {
      type: Number,
      required: true,
      min: 1
    },

    acceptedBy: {
      type: String,
      required: true,
      trim: true
    },

    acceptedAt: {
      type: Date,
      required: true
    },

    agreementConfirmed: {
      type: Boolean,
      required: true,
      validate: {
        validator: (value: boolean) => value === true,
        message: "Contract acceptance must be explicitly confirmed."
      }
    },

    acceptedDocumentFileId: {
      type: Schema.Types.ObjectId,
      ref: "File",
      default: null
    },

    evidence: {
      ipAddress: {
        type: String,
        default: null
      },

      userAgent: {
        type: String,
        default: null
      }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

contractAcceptanceSchema.index(
  { contractId: 1, contractVersion: 1 },
  { unique: true }
);

export type ContractAcceptanceDocument =
  InferSchemaType<typeof contractAcceptanceSchema>;

export const ContractAcceptance = model(
  "ContractAcceptance",
  contractAcceptanceSchema
);
