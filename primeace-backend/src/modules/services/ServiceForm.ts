import {
  model,
  Schema,
  type InferSchemaType
} from "mongoose";

import type {
  ServiceFormFieldType,
  FormConditionOperator
} from "@primeace/shared";

const formFieldOptionSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },

    value: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const formFieldConditionSchema = new Schema(
  {
    fieldKey: {
      type: String,
      required: true
    },

    operator: {
      type: String,
      enum: [
        "equals",
        "not_equals",
        "contains",
        "not_contains"
      ],
      required: true
    },

    value: {
      type: Schema.Types.Mixed,
      required: true
    }
  },
  { _id: false }
);

const formFieldValidationSchema = new Schema(
  {
    minLength: {
      type: Number,
      min: 0
    },

    maxLength: {
      type: Number,
      min: 0
    },

    min: {
      type: Number
    },

    max: {
      type: Number
    },

    pattern: {
      type: String
    }
  },
  { _id: false }
);

const serviceFormFieldSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true
    },

    label: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: [
        "text",
        "textarea",
        "email",
        "tel",
        "number",
        "select",
        "multiselect",
        "radio",
        "checkbox",
        "date",
        "file"
      ],
      required: true
    },

    required: {
      type: Boolean,
      default: false
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0
    },

    placeholder: {
      type: String,
      default: null
    },

    helpText: {
      type: String,
      default: null
    },

    options: {
      type: [formFieldOptionSchema],
      default: []
    },

    conditions: {
      type: [formFieldConditionSchema],
      default: []
    },

    validation: {
      type: formFieldValidationSchema,
      default: null
    },

    acceptedMimeTypes: {
      type: [String],
      default: []
    },

    maxFiles: {
      type: Number,
      min: 1,
      default: null
    },

    maxFileSizeBytes: {
      type: Number,
      min: 1,
      default: null
    }
  },
  { _id: false }
);

const serviceFormSchema = new Schema(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true
    },

    version: {
      type: Number,
      required: true,
      min: 1
    },

    fields: {
      type: [serviceFormFieldSchema],
      required: true,
      validate: {
        validator: (fields: unknown[]) => fields.length > 0,
        message: "A service form must contain at least one field."
      }
    },

    isActive: {
      type: Boolean,
      default: false,
      index: true
    },

    publishedAt: {
      type: Date,
      default: null
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

serviceFormSchema.index(
  { serviceId: 1, version: 1 },
  { unique: true }
);

serviceFormSchema.index(
  { serviceId: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true
    }
  }
);

serviceFormSchema.pre("validate", function () {
  const keys = this.fields.map((field) => field.key);

  if (new Set(keys).size !== keys.length) {
    this.invalidate(
      "fields",
      "Form field keys must be unique within a form version."
    );
  }
});

export type ServiceFormDocument =
  InferSchemaType<typeof serviceFormSchema>;

export const ServiceForm = model(
  "ServiceForm",
  serviceFormSchema
);
