import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid category ID.");

const categoryBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must contain at least 2 characters.")
    .max(100, "Category name must not exceed 100 characters."),

  slug: z
    .string()
    .trim()
    .min(2, "Category slug must contain at least 2 characters.")
    .max(120, "Category slug must not exceed 120 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Category slug must contain lowercase letters, numbers and hyphens only."
    ),

  description: z
    .string()
    .trim()
    .min(2, "Category description must contain at least 2 characters.")
    .max(500, "Category description must not exceed 500 characters."),

  displayOrder: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
});

export const createServiceCategorySchema = z.object({
  body: categoryBodySchema
});

export const updateServiceCategorySchema = z.object({
  params: z.object({
    categoryId: objectIdSchema
  }),

  body: categoryBodySchema
    .partial()
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one field to update."
    )
});

export const getServiceCategorySchema = z.object({
  params: z.object({
    categoryId: objectIdSchema
  })
});

export const listServiceCategoriesSchema = z.object({
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

export const updateServiceCategoryStatusSchema = z.object({
  params: z.object({
    categoryId: objectIdSchema
  }),

  body: z.object({
    isActive: z.boolean()
  })
});

export const deleteServiceCategorySchema = z.object({
  params: z.object({
    categoryId: objectIdSchema
  })
});

export type CreateServiceCategoryInput = z.output<
  typeof createServiceCategorySchema
>["body"];

export type UpdateServiceCategoryInput = z.output<
  typeof updateServiceCategorySchema
>["body"];

export type GetServiceCategoryParams = z.output<
  typeof getServiceCategorySchema
>["params"];

export type ListServiceCategoriesQuery = z.output<
  typeof listServiceCategoriesSchema
>["query"];

export type UpdateServiceCategoryStatusInput = z.output<
  typeof updateServiceCategoryStatusSchema
>["body"];
