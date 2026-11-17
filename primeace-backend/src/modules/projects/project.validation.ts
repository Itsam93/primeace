import { z } from "zod";

import {
  ProjectSource,
  ProjectStatus
} from "@primeace/shared";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "A valid ID is required.");

const dateTimeSchema = z.iso.datetime({
  message: "A valid ISO date and time is required."
});

const historicalProjectBodySchema = z.object({
  clientId: objectIdSchema,

  title: z
    .string()
    .trim()
    .min(2, "Project title must contain at least 2 characters.")
    .max(200, "Project title must not exceed 200 characters."),

  description: z
    .string()
    .trim()
    .min(2, "Project description must contain at least 2 characters.")
    .max(5000, "Project description must not exceed 5000 characters."),

  serviceNames: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Service names cannot contain empty values.")
        .max(150, "Each service name must not exceed 150 characters.")
    )
    .min(1, "At least one service must be provided.")
    .max(30, "A project cannot have more than 30 services."),

  contractAmountKobo: z
    .number()
    .int()
    .min(0, "Project amount cannot be negative.")
    .nullable()
    .default(null),

  startDate: dateTimeSchema.nullable().default(null),

  expectedCompletionDate: dateTimeSchema
    .nullable()
    .default(null),

  completedAt: dateTimeSchema,

  status: z
    .nativeEnum(ProjectStatus)
    .default(ProjectStatus.COMPLETED)
}).strict().refine(
  (input) =>
    !input.startDate ||
    !input.completedAt ||
    new Date(input.startDate) <= new Date(input.completedAt),
  {
    message: "The start date cannot be later than the completion date.",
    path: ["completedAt"]
  }
).refine(
  (input) =>
    !input.expectedCompletionDate ||
    !input.startDate ||
    new Date(input.expectedCompletionDate) >= new Date(input.startDate),
  {
    message: "The expected completion date cannot be earlier than the start date.",
    path: ["expectedCompletionDate"]
  }
);

export const createHistoricalProjectSchema = z.object({
  body: historicalProjectBodySchema,
  params: z.object({}).strict(),
  query: z.object({}).strict()
}).strict();

export const projectIdParamsSchema = z.object({
  params: z.object({
    projectId: objectIdSchema
  }).strict()
});

export const listProjectsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    search: z.string().trim().min(1).max(200).optional(),

    status: z.nativeEnum(ProjectStatus).optional(),

    source: z.nativeEnum(ProjectSource).optional(),

    clientId: objectIdSchema.optional(),

    serviceRequestId: objectIdSchema.optional(),

    quotationId: objectIdSchema.optional(),

    contractId: objectIdSchema.optional(),

    from: dateTimeSchema.optional(),

    to: dateTimeSchema.optional(),

    sortBy: z.enum([
      "createdAt",
      "updatedAt",
      "projectReference",
      "title",
      "status",
      "contractAmountKobo",
      "expectedCompletionDate"
    ]).default("createdAt"),

    sortOrder: z.enum([
      "asc",
      "desc"
    ]).default("desc")
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

export const updateProjectStatusSchema = z.object({
  params: z.object({
    projectId: objectIdSchema
  }).strict(),

  body: z.object({
    status: z.nativeEnum(ProjectStatus)
  }).strict()
}).strict();

export type CreateHistoricalProjectInput =
  z.output<typeof createHistoricalProjectSchema>["body"];

export type ListProjectsQuery =
  z.output<typeof listProjectsSchema>["query"];

export type UpdateProjectStatusInput =
  z.output<typeof updateProjectStatusSchema>["body"];

export type ProjectIdParams =
  z.output<typeof projectIdParamsSchema>["params"];
