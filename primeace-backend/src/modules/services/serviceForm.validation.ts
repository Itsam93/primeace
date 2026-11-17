import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID.");

const serviceFormFieldTypeSchema = z.enum([
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
]);

const formConditionOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains"
]);

const optionFieldTypes = [
  "select",
  "multiselect",
  "radio",
  "checkbox"
] as const;

const fieldOptionSchema = z.object({
  label: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(100)
}).strict();

const fieldConditionSchema = z.object({
  fieldKey: z.string().trim().min(1).max(100),
  operator: formConditionOperatorSchema,
  value: z.unknown()
}).strict();

const fieldValidationSchema = z.object({
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().max(500).optional()
}).strict().superRefine((validation, context) => {
  if (
    validation.minLength !== undefined &&
    validation.maxLength !== undefined &&
    validation.minLength > validation.maxLength
  ) {
    context.addIssue({
      code: "custom",
      path: ["maxLength"],
      message: "Maximum length cannot be less than minimum length."
    });
  }

  if (
    validation.min !== undefined &&
    validation.max !== undefined &&
    validation.min > validation.max
  ) {
    context.addIssue({
      code: "custom",
      path: ["max"],
      message: "Maximum value cannot be less than minimum value."
    });
  }

  if (validation.pattern !== undefined) {
    try {
      new RegExp(validation.pattern);
    } catch {
      context.addIssue({
        code: "custom",
        path: ["pattern"],
        message: "Invalid regular expression."
      });
    }
  }
});

const serviceFormFieldSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      "Field keys must start with a letter and contain only letters, numbers, and underscores."
    ),

  label: z.string().trim().min(1).max(150),

  type: serviceFormFieldTypeSchema,

  required: z.boolean().default(false),

  displayOrder: z.number().int().min(0).default(0),

  placeholder: z.string().trim().max(200).nullable().optional(),

  helpText: z.string().trim().max(500).nullable().optional(),

  options: z.array(fieldOptionSchema).default([]),

  conditions: z.array(fieldConditionSchema).default([]),

  validation: fieldValidationSchema.nullable().optional(),

  acceptedMimeTypes: z.array(
    z.string().trim().min(1).max(100)
  ).default([]),

  maxFiles: z.number().int().min(1).nullable().optional(),

  maxFileSizeBytes: z.number().int().min(1).nullable().optional()
}).strict().superRefine((field, context) => {
  const isOptionField = optionFieldTypes.includes(
    field.type as typeof optionFieldTypes[number]
  );

  const isFileField = field.type === "file";

  if (isOptionField && field.options.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["options"],
      message: "This field type requires at least one option."
    });
  }

  if (!isOptionField && field.options.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["options"],
      message: "Options are only supported for select, multiselect, radio, and checkbox fields."
    });
  }

  if (
    !isFileField &&
    (
      field.acceptedMimeTypes.length > 0 ||
      field.maxFiles !== undefined && field.maxFiles !== null ||
      field.maxFileSizeBytes !== undefined && field.maxFileSizeBytes !== null
    )
  ) {
    context.addIssue({
      code: "custom",
      path: ["type"],
      message: "File restrictions can only be configured for file fields."
    });
  }

  const optionValues = field.options.map((option) => option.value);

  if (new Set(optionValues).size !== optionValues.length) {
    context.addIssue({
      code: "custom",
      path: ["options"],
      message: "Option values must be unique."
    });
  }
});

const formFieldsSchema = z
  .array(serviceFormFieldSchema)
  .min(1, "A service form must contain at least one field.")
  .max(100, "A service form cannot contain more than 100 fields.")
  .superRefine((fields, context) => {
    const keys = fields.map((field) => field.key);

    if (new Set(keys).size !== keys.length) {
      context.addIssue({
        code: "custom",
        message: "Form field keys must be unique."
      });
    }

    const fieldKeys = new Set(keys);

    fields.forEach((field, index) => {
      field.conditions.forEach((condition, conditionIndex) => {
        if (!fieldKeys.has(condition.fieldKey)) {
          context.addIssue({
            code: "custom",
            path: [
              index,
              "conditions",
              conditionIndex,
              "fieldKey"
            ],
            message: "Condition references a field that does not exist."
          });
        }

        if (condition.fieldKey === field.key) {
          context.addIssue({
            code: "custom",
            path: [
              index,
              "conditions",
              conditionIndex,
              "fieldKey"
            ],
            message: "A field cannot depend on itself."
          });
        }
      });
    });
  });

const createServiceFormBodySchema = z.object({
  fields: formFieldsSchema
}).strict();

const updateServiceFormBodySchema = z.object({
  fields: formFieldsSchema
}).strict();

const emptyObjectSchema = z.object({}).strict();

export const createServiceFormSchema = z.object({
  body: createServiceFormBodySchema,
  params: z.object({
    serviceId: objectIdSchema
  }).strict(),
  query: emptyObjectSchema
}).strict();

export const updateServiceFormSchema = z.object({
  body: updateServiceFormBodySchema,
  params: z.object({
    serviceId: objectIdSchema,
    formId: objectIdSchema
  }).strict(),
  query: emptyObjectSchema
}).strict();

export const getServiceFormSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    serviceId: objectIdSchema
  }).strict(),
  query: emptyObjectSchema
}).strict();

export const getServiceFormVersionSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    serviceId: objectIdSchema,
    formId: objectIdSchema
  }).strict(),
  query: emptyObjectSchema
}).strict();

export const listServiceFormsSchema = z.object({
  body: emptyObjectSchema,
  params: z.object({
    serviceId: objectIdSchema
  }).strict(),
  query: emptyObjectSchema
}).strict();

export const publishServiceFormSchema = getServiceFormVersionSchema;

export const archiveServiceFormSchema = getServiceFormVersionSchema;

export type CreateServiceFormInput = z.infer<
  typeof createServiceFormBodySchema
>;

export type UpdateServiceFormInput = z.infer<
  typeof updateServiceFormBodySchema
>;

export type ServiceFormFieldInput = z.infer<
  typeof serviceFormFieldSchema
>;
