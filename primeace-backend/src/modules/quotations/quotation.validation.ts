import { z } from "zod";

import { QuotationStatus } from "@primeace/shared";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "A valid ID is required.");

const moneyKoboSchema = z
  .number()
  .int()
  .safe()
  .min(0, "Amount cannot be negative.");

const quotationItemSchema = z
  .object({
    serviceRequestItemId: objectIdSchema.nullable().optional(),

    serviceName: z
      .string()
      .trim()
      .min(1, "Service name is required.")
      .max(200),

    description: z
      .string()
      .trim()
      .min(1, "Item description is required.")
      .max(5000),

    deliverables: z
      .array(z.string().trim().min(1).max(500))
      .max(50)
      .default([]),

    quantity: z
      .number()
      .int()
      .safe()
      .min(1)
      .max(100000),

    unitAmountKobo: moneyKoboSchema
  })
  .strict();

const quotationDraftSchema = z
  .object({
    serviceRequestId: objectIdSchema,

    items: z
      .array(quotationItemSchema)
      .min(1, "A quotation must contain at least one item.")
      .max(100),

    discountKobo: moneyKoboSchema.default(0),

    scope: z
      .string()
      .trim()
      .min(1, "Quotation scope is required.")
      .max(10000),

    terms: z
      .array(z.string().trim().min(1).max(2000))
      .max(50)
      .default([]),

    validUntil: z.iso.datetime({
      message: "A valid ISO date and time is required."
    })
  })
  .strict();

const quotationIdParamsSchema = z.object({
  quotationId: objectIdSchema
});

const quotationAccessTokenParamsSchema = z.object({
  token: z.string().min(32).max(512)
});

const quotationResponseBodySchema = z
  .object({
    response: z.enum([
      "approved",
      "declined",
      "revision_requested"
    ]),

    comments: z
      .string()
      .trim()
      .max(5000)
      .optional()
  })
  .strict()
  .superRefine((body, context) => {
    if (
      body.response === "revision_requested" &&
      !body.comments
    ) {
      context.addIssue({
        code: "custom",
        path: ["comments"],
        message: "Please explain the changes you are requesting."
      });
    }
  });

export const createQuotationSchema = z.object({
  body: quotationDraftSchema
});

export const updateQuotationSchema = z.object({
  params: quotationIdParamsSchema,

  body: z
    .object({
      items: quotationDraftSchema.shape.items.optional(),

      discountKobo:
        quotationDraftSchema.shape.discountKobo.optional(),

      scope: quotationDraftSchema.shape.scope.optional(),

      terms: quotationDraftSchema.shape.terms.optional(),

      validUntil:
        quotationDraftSchema.shape.validUntil.optional()
    })
    .strict()
    .refine(
      (body) => Object.keys(body).length > 0,
      "At least one field must be provided."
    )
});

export const quotationIdParamsSchemaValidator = z.object({
  params: quotationIdParamsSchema
});

export const listQuotationsSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),

      limit: z.coerce.number().int().min(1).max(100).default(20),

      search: z.string().trim().max(200).optional(),

      status: z.nativeEnum(QuotationStatus).optional(),

      clientId: objectIdSchema.optional(),

      serviceRequestId: objectIdSchema.optional(),

      from: z.iso.datetime().optional(),

      to: z.iso.datetime().optional(),

      sortBy: z
        .enum([
          "createdAt",
          "updatedAt",
          "quotationNumber",
          "validUntil",
          "totalAmountKobo",
          "status"
        ])
        .default("createdAt"),

      sortOrder: z.enum(["asc", "desc"]).default("desc")
    })
    .strict()
    .refine(
      (query) =>
        !query.from ||
        !query.to ||
        new Date(query.from) <= new Date(query.to),
      {
        message: "The start date cannot be later than the end date.",
        path: ["from"]
      }
    )
});

export const quotationActionSchema = z.object({
  params: quotationIdParamsSchema
});

export const getPublicQuotationSchema = z.object({
  params: quotationAccessTokenParamsSchema
});

export const quotationClientResponseSchema = z.object({
  params: quotationAccessTokenParamsSchema,

  body: quotationResponseBodySchema
});

export type CreateQuotationInput = z.infer<
  typeof createQuotationSchema
>["body"];

export type UpdateQuotationInput = z.infer<
  typeof updateQuotationSchema
>["body"];

export type ListQuotationsQuery = z.infer<
  typeof listQuotationsSchema
>["query"];

export type QuotationClientResponseInput = z.infer<
  typeof quotationClientResponseSchema
>["body"];
