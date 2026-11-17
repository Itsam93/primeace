import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import {
  ReviewStatus
} from "@primeace/shared";

const reviewSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true
    },

    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true
    },

    rating: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5]
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },

    displayPreference: {
      type: String,
      enum: ["full_name", "first_name", "anonymous"],
      required: true
    },

    displayName: {
      type: String,
      default: null,
      trim: true
    },

    consentToPublish: {
      type: Boolean,
      required: true,
      default: false
    },

    submissionMethod: {
      type: String,
      enum: ["client", "admin"],
      required: true,
      default: "client"
    },

    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      required: true
    },

    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.PENDING,
      required: true,
      index: true
    },

    isFeatured: {
      type: Boolean,
      default: false
    },

    moderatedAt: {
      type: Date,
      default: null
    },

    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },

    moderationNote: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

reviewSchema.pre("validate", function () {
  if (
    this.submissionMethod === "admin" &&
    !this.submittedBy
  ) {
    this.invalidate(
      "submittedBy",
      "An administrator must be identified for admin-submitted reviews."
    );
  }

  if (
    this.submissionMethod === "client" &&
    this.submittedBy
  ) {
    this.invalidate(
      "submittedBy",
      "Client-submitted reviews cannot have an administrator submitter."
    );
  }

  if (
    this.isFeatured &&
    (
      this.status !== ReviewStatus.APPROVED ||
      !this.consentToPublish
    )
  ) {
    this.invalidate(
      "isFeatured",
      "Only approved reviews with publication consent can be featured."
    );
  }
});

reviewSchema.index({
  status: 1,
  isFeatured: -1,
  createdAt: -1
});

reviewSchema.index({
  submissionMethod: 1,
  submittedAt: -1
});

export type ReviewDocument = InferSchemaType<typeof reviewSchema>;

export const Review = model("Review", reviewSchema);
