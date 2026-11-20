import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid project category ID.");

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
    .max(500, "Category description must not exceed 500 characters.")
    .nullable()
    .optional(),

  sortOrder: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
});

export const createProjectCategorySchema = z.object({
  body: categoryBodySchema
});

export const updateProjectCategorySchema = z.object({
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

export const getProjectCategorySchema = z.object({
  params: z.object({
    categoryId: objectIdSchema
  })
});

export const listProjectCategoriesSchema = z.object({
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
      .enum(["name", "sortOrder", "createdAt", "updatedAt"])
      .default("sortOrder"),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("asc")
  })
});

export const updateProjectCategoryStatusSchema = z.object({
  params: z.object({
    categoryId: objectIdSchema
  }),

  body: z.object({
    isActive: z.boolean()
  })
});

export const deleteProjectCategorySchema = z.object({
  params: z.object({
    categoryId: objectIdSchema
  })
});

export type CreateProjectCategoryInput = z.output<
  typeof createProjectCategorySchema
>["body"];

export type UpdateProjectCategoryInput = z.output<
  typeof updateProjectCategorySchema
>["body"];

export type GetProjectCategoryParams = z.output<
  typeof getProjectCategorySchema
>["params"];

export type ListProjectCategoriesQuery = z.output<
  typeof listProjectCategoriesSchema
>["query"];

export type UpdateProjectCategoryStatusInput = z.output<
  typeof updateProjectCategoryStatusSchema
>["body"];
