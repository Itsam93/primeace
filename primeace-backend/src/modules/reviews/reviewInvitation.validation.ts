import { z } from "zod";

import { ReviewInvitationStatus } from "@primeace/shared";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "A valid ID is required.");

const tokenSchema = z
  .string()
  .regex(
    /^[a-f\d]{64}$/i,
    "A valid review invitation token is required."
  );

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

const commentSchema = z
  .string()
  .trim()
  .min(1, "Review comment is required.")
  .max(
    3000,
    "Review comment cannot exceed 3000 characters."
  );

export const createReviewInvitationSchema = z.object({
  body: z.object({
    projectId: objectIdSchema
  }).strict()
});

export const listReviewInvitationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z
      .string()
      .trim()
      .max(200, "Search cannot exceed 200 characters.")
      .optional(),
    status: z.nativeEnum(ReviewInvitationStatus).optional()
  }).strict()
});

export const reviewInvitationIdParamsSchema = z.object({
  params: z.object({
    invitationId: objectIdSchema
  }).strict()
});

export const publicReviewInvitationTokenParamsSchema = z.object({
  params: z.object({
    token: tokenSchema
  }).strict()
});

export const submitClientReviewSchema = z.object({
  params: z.object({
    token: tokenSchema
  }).strict(),

  body: z.object({
    rating: ratingSchema,
    comment: commentSchema,
    displayPreference: displayPreferenceSchema,
    consentToPublish: z.boolean()
  }).strict()
});

export type CreateReviewInvitationInput =
  z.infer<typeof createReviewInvitationSchema>["body"];

export type ListReviewInvitationsQuery =
  z.infer<typeof listReviewInvitationsSchema>["query"];

export type SubmitClientReviewInput =
  z.infer<typeof submitClientReviewSchema>["body"];
