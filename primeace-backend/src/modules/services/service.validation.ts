import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid service ID.");

const serviceBodySchema = z.object({
  categoryId: objectIdSchema,

  name: z
    .string()
    .trim()
    .min(2, "Service name must contain at least 2 characters.")
    .max(100, "Service name must not exceed 100 characters."),

  slug: z
    .string()
    .trim()
    .min(2, "Service slug must contain at least 2 characters.")
    .max(120, "Service slug must not exceed 120 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Service slug must contain lowercase letters, numbers and hyphens only."
    ),

  shortDescription: z
    .string()
    .trim()
    .min(2, "Short description must contain at least 2 characters.")
    .max(250, "Short description must not exceed 250 characters."),

  description: z
    .string()
    .trim()
    .min(2, "Service description must contain at least 2 characters.")
    .max(5000, "Service description must not exceed 5000 characters."),

  deliverables: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Deliverables cannot contain empty values.")
        .max(250, "Each deliverable must not exceed 250 characters.")
    )
    .max(30, "A service cannot have more than 30 deliverables.")
    .default([]),

  displayOrder: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
});

export const createServiceSchema = z.object({
  body: serviceBodySchema
});

export const updateServiceSchema = z.object({
  params: z.object({
    serviceId: objectIdSchema
  }),

  body: serviceBodySchema
    .partial()
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one field to update."
    )
});

export const getServiceSchema = z.object({
  params: z.object({
    serviceId: objectIdSchema
  })
});

export const listServicesSchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    search: z
      .string()
      .trim()
      .max(100)
      .optional(),

    categoryId: objectIdSchema.optional(),

    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),

    includeDeleted: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .default(false),

    sortBy: z
      .enum(["name", "displayOrder", "createdAt", "updatedAt"])
      .default("displayOrder"),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("asc")
  })
});

export const updateServiceStatusSchema = z.object({
  params: z.object({
    serviceId: objectIdSchema
  }),

  body: z.object({
    isActive: z.boolean()
  })
});

export const deleteServiceSchema = z.object({
  params: z.object({
    serviceId: objectIdSchema
  })
});

export type CreateServiceInput = z.output<
  typeof createServiceSchema
>["body"];

export type UpdateServiceInput = z.output<
  typeof updateServiceSchema
>["body"];

export type GetServiceParams = z.output<
  typeof getServiceSchema
>["params"];

export type ListServicesQuery = z.output<
  typeof listServicesSchema
>["query"];

export type UpdateServiceStatusInput = z.output<
  typeof updateServiceStatusSchema
>["body"];
