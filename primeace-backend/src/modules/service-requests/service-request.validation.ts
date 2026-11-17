import { z } from "zod";

import { RequestStatus } from "@primeace/shared";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid resource ID.");

const dateSchema = z
  .string()
  .datetime({ offset: true });

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const listServiceRequestsSchema = z.object({
  query: paginationSchema.extend({
    search: z.string().trim().max(100).optional(),
    status: z.nativeEnum(RequestStatus).optional(),
    serviceId: objectIdSchema.optional(),
    categoryId: objectIdSchema.optional(),
    submittedFrom: dateSchema.optional(),
    submittedTo: dateSchema.optional(),
    sortBy: z
      .enum(["submittedAt", "createdAt", "status"])
      .default("submittedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc")
  })
});

export const getServiceRequestSchema = z.object({
  params: z.object({
    requestId: objectIdSchema
  })
});

export const updateServiceRequestStatusSchema = z.object({
  params: z.object({
    requestId: objectIdSchema
  }),
  body: z.object({
    status: z.nativeEnum(RequestStatus)
  })
});

export const createServiceRequestNoteSchema = z.object({
  params: z.object({
    requestId: objectIdSchema
  }),
  body: z.object({
    content: z
      .string()
      .trim()
      .min(1, "Note content is required.")
      .max(5000, "Note cannot exceed 5,000 characters.")
  })
});

export const listServiceRequestNotesSchema = z.object({
  params: z.object({
    requestId: objectIdSchema
  }),
  query: paginationSchema
});

export type ListServiceRequestsInput = z.output<
  typeof listServiceRequestsSchema
>;

export type GetServiceRequestInput = z.output<
  typeof getServiceRequestSchema
>;

export type UpdateServiceRequestStatusInput = z.output<
  typeof updateServiceRequestStatusSchema
>;

export type CreateServiceRequestNoteInput = z.output<
  typeof createServiceRequestNoteSchema
>;

export type ListServiceRequestNotesInput = z.output<
  typeof listServiceRequestNotesSchema
>;
