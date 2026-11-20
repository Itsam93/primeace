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

export interface ProjectMedia {
  url: string;
  publicId: string;
  alt: string;
}

export interface ProjectVideoClip {
  url: string;
  publicId: string;
  thumbnailUrl: string;
  alt: string;
}

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

  categoryId: Types.ObjectId | null;

  coverImage: ProjectMedia | null;
  videoClip: ProjectVideoClip | null;

  contractAmountKobo: number | null;

  status: ProjectStatus;

  startDate: Date | null;
  expectedCompletionDate: Date | null;
  completedAt: Date | null;

  isFeatured: boolean;

  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const projectCoverImageSchema = new Schema<ProjectMedia>(
  {
    url: {
      type: String,
      required: true,
      trim: true
    },

    publicId: {
      type: String,
      required: true,
      trim: true
    },

    alt: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false
  }
);

const projectVideoClipSchema = new Schema<ProjectVideoClip>(
  {
    url: {
      type: String,
      required: true,
      trim: true
    },

    publicId: {
      type: String,
      required: true,
      trim: true
    },

    thumbnailUrl: {
      type: String,
      required: true,
      trim: true
    },

    alt: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false
  }
);

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

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectCategory",
      default: null,
      index: true
    },

    coverImage: {
      type: projectCoverImageSchema,
      default: null
    },

    videoClip: {
      type: projectVideoClipSchema,
      default: null
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

    isFeatured: {
      type: Boolean,
      default: false,
      index: true
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

// Supports public featured-project queries.
projectSchema.index(
  {
    status: 1,
    isFeatured: 1,
    isDeleted: 1,
    completedAt: -1
  },
  {
    partialFilterExpression: {
      status: ProjectStatus.COMPLETED,
      isFeatured: true,
      isDeleted: false
    }
  }
);

// Supports filtering projects by showcase category.
projectSchema.index({
  categoryId: 1,
  status: 1,
  isFeatured: 1,
  isDeleted: 1,
  completedAt: -1
});

export const Project = model<ProjectRecord>(
  "Project",
  projectSchema
);