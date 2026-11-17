import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

const contractAccessTokenSchema = new Schema(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      index: true
    },

    contractVersion: {
      type: Number,
      required: true,
      min: 1
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false
    },

    expiresAt: {
      type: Date,
      required: true
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

contractAccessTokenSchema.index({
  contractId: 1,
  contractVersion: 1,
  revokedAt: 1,
  expiresAt: 1
});

export type ContractAccessTokenDocument =
  InferSchemaType<typeof contractAccessTokenSchema>;

export const ContractAccessToken = model(
  "ContractAccessToken",
  contractAccessTokenSchema
);
