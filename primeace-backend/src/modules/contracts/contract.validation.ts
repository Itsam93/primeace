import { z } from "zod";

import { ContractStatus } from "@primeace/shared";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "A valid ID is required.");

const dateTimeSchema = z.iso.datetime({
  message: "A valid ISO date and time is required."
});

const accessTokenSchema = z
  .string()
  .min(32)
  .max(512);

const titleSchema = z
  .string()
  .trim()
  .min(1, "Contract title is required.")
  .max(200);

const scopeSchema = z
  .string()
  .trim()
  .min(1, "Contract scope is required.")
  .max(10000);

const deliverablesSchema = z
  .array(
    z.string().trim().min(1).max(500)
  )
  .max(50);

const termsSchema = z
  .array(
    z.string().trim().min(1).max(10000)
  )
  .max(50);

const optionalDateSchema = dateTimeSchema
  .nullable()
  .optional();

function validateDateSequence(
  data: {
    startDate?: string | null | undefined;
    expectedCompletionDate?: string | null | undefined;
  },
  context: z.RefinementCtx
) {
  if (
    data.startDate &&
    data.expectedCompletionDate &&
    new Date(data.expectedCompletionDate) <
      new Date(data.startDate)
  ) {
    context.addIssue({
      code: "custom",
      path: ["expectedCompletionDate"],
      message: "Expected completion date cannot precede the start date."
    });
  }
}

function validateFutureAcceptanceDeadline(
  data: {
    acceptanceDeadline?: string | null | undefined;
  },
  context: z.RefinementCtx
) {
  if (
    data.acceptanceDeadline &&
    new Date(data.acceptanceDeadline) <= new Date()
  ) {
    context.addIssue({
      code: "custom",
      path: ["acceptanceDeadline"],
      message: "Acceptance deadline must be in the future."
    });
  }
}

const contractDetailsShape = {
  title: titleSchema,
  startDate: optionalDateSchema,
  expectedCompletionDate: optionalDateSchema,
  acceptanceDeadline: optionalDateSchema
};

export const createContractSchema = z.object({
  body: z.object({
    quotationId: objectIdSchema,
    ...contractDetailsShape
  })
    .strict()
    .superRefine((data, context) => {
      validateDateSequence(data, context);
      validateFutureAcceptanceDeadline(data, context);
    })
});

export const updateContractSchema = z.object({
  params: z.object({
    contractId: objectIdSchema
  }).strict(),

  body: z.object({
    title: titleSchema.optional(),
    scope: scopeSchema.optional(),
    deliverables: deliverablesSchema.optional(),
    terms: termsSchema.optional(),
    startDate: optionalDateSchema,
    expectedCompletionDate: optionalDateSchema,
    acceptanceDeadline: optionalDateSchema
  })
    .strict()
    .refine(
      (body) => Object.keys(body).length > 0,
      {
        message: "At least one field must be provided."
      }
    )
    .superRefine((data, context) => {
      validateDateSequence(data, context);
      validateFutureAcceptanceDeadline(data, context);
    })
});

export const contractIdParamsSchema = z.object({
  params: z.object({
    contractId: objectIdSchema
  }).strict()
});

export const contractActionSchema = contractIdParamsSchema;

export const listContractsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    status: z.nativeEnum(ContractStatus).optional(),
    clientId: objectIdSchema.optional(),
    quotationId: objectIdSchema.optional(),
    serviceRequestId: objectIdSchema.optional(),
    from: dateTimeSchema.optional(),
    to: dateTimeSchema.optional(),

    sortBy: z.enum([
      "createdAt",
      "updatedAt",
      "contractNumber",
      "contractAmountKobo",
      "status",
      "expectedCompletionDate"
    ]).default("createdAt"),

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


export const contractAccessTokenParamsSchema = z.object({
  params: z.object({
    token: accessTokenSchema
  }).strict()
});


export const contractClientResponseSchema = z.object({
  params: z.object({
    token: accessTokenSchema
  }).strict(),

  body: z.discriminatedUnion("response", [
    z.object({
      response: z.literal("accepted"),

      acceptedBy: z.string().trim().min(1).max(200),

      agreementConfirmed: z.literal(true, {
        error: "You must explicitly confirm your agreement to the contract."
      }),

      acceptedDocumentFileId: objectIdSchema
        .nullable()
        .optional()
    }).strict(),

    z.object({
      response: z.literal("rejected")
    }).strict()
  ])
});


export type CreateContractInput =
  z.infer<typeof createContractSchema>["body"];

export type UpdateContractInput =
  z.infer<typeof updateContractSchema>["body"];

export type ListContractsQuery =
  z.infer<typeof listContractsSchema>["query"];

export type ContractClientResponseInput =
  z.infer<typeof contractClientResponseSchema>["body"];
