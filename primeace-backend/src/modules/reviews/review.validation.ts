import { z } from "zod";

import { ReviewStatus } from "@primeace/shared";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "A valid ID is required.");

const ratingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5)
]);

const displayPreferenceSchema = z.enum([
  "full_name",
  "first_name",
  "anonymous"
]);

const submissionMethodSchema = z.enum([
  "client",
  "admin"
]);

const moderationStatusSchema = z.enum([
  ReviewStatus.APPROVED,
  ReviewStatus.REJECTED,
  ReviewStatus.HIDDEN
]);

const commentSchema = z
  .string()
  .trim()
  .min(1, "Review comment is required.")
  .max(3000, "Review comment cannot exceed 3000 characters.");

const moderationNoteSchema = z
  .string()
  .trim()
  .max(1000, "Moderation note cannot exceed 1000 characters.")
  .nullable()
  .optional();

/*
|--------------------------------------------------------------------------
| Create administrator-entered review
|--------------------------------------------------------------------------
*/

export const createAdminReviewSchema = z.object({
  body: z.object({
    projectId: objectIdSchema,

    rating: ratingSchema,

    comment: commentSchema,

    displayPreference: displayPreferenceSchema,

    consentToPublish: z.literal(true, {
      error: "Explicit client consent to publish the review is required."
    })
  }).strict()
});

/*
|--------------------------------------------------------------------------
| List reviews
|--------------------------------------------------------------------------
*/

export const listReviewsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    search: z
      .string()
      .trim()
      .max(200, "Search cannot exceed 200 characters.")
      .optional(),

    status: z.nativeEnum(ReviewStatus).optional(),

    submissionMethod: submissionMethodSchema.optional()
  }).strict()
});

/*
|--------------------------------------------------------------------------
| Review ID parameters
|--------------------------------------------------------------------------
*/

export const reviewIdParamsSchema = z.object({
  params: z.object({
    reviewId: objectIdSchema
  }).strict()
});

/*
|--------------------------------------------------------------------------
| Moderate review
|--------------------------------------------------------------------------
*/

export const moderateReviewSchema = z.object({
  params: z.object({
    reviewId: objectIdSchema
  }).strict(),

  body: z.object({
    status: moderationStatusSchema,

    isFeatured: z.boolean().optional(),

    moderationNote: moderationNoteSchema
  }).strict()
});

/*
|--------------------------------------------------------------------------
| Inferred request types
|--------------------------------------------------------------------------
*/

export type CreateAdminReviewInput =
  z.infer<typeof createAdminReviewSchema>["body"];

export type ListReviewsQuery =
  z.infer<typeof listReviewsSchema>["query"];

export type ModerateReviewInput =
  z.infer<typeof moderateReviewSchema>["body"];
