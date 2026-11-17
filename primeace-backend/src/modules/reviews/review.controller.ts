import type { RequestHandler } from "express";

import { ApiError } from "../../shared/errors/ApiError.js";

import {
  createAdminReview,
  getEligibleReviewProjects,
  getReviews,
  getReviewById,
  moderateReview,
  getFeaturedReviews
} from "./reviewServices.js";

import type {
  CreateAdminReviewInput,
  ListReviewsQuery,
  ModerateReviewInput
} from "./review.validation.js";

interface ValidatedRequestData {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
}

function getValidatedData(
  response: Parameters<RequestHandler>[1]
): ValidatedRequestData {
  const validated = response.locals.validated as
    | ValidatedRequestData
    | undefined;

  if (!validated) {
    throw new ApiError(
      500,
      "Validated request data is unavailable."
    );
  }

  return validated;
}

function getAdminId(
  response: Parameters<RequestHandler>[1]
): string {
  const admin = response.locals.admin as
    | { _id?: { toString(): string } }
    | undefined;

  if (!admin?._id) {
    throw new ApiError(
      401,
      "Administrator authentication is required."
    );
  }

  return admin._id.toString();
}

function getAuditContext(
  request: Parameters<RequestHandler>[0]
) {
  return {
    ipAddress: request.ip ?? null,
    userAgent: request.get("user-agent") ?? null
  };
}

/*
|--------------------------------------------------------------------------
| Eligible review projects
|--------------------------------------------------------------------------
*/

export const getEligibleReviewProjectsHandler: RequestHandler =
  async (_request, response) => {
    const projects = await getEligibleReviewProjects();

    response.status(200).json({
      success: true,
      message: "Eligible review projects retrieved successfully.",
      data: projects
    });
  };

/*
|--------------------------------------------------------------------------
| Create administrator-entered review
|--------------------------------------------------------------------------
*/

export const createAdminReviewHandler: RequestHandler =
  async (request, response) => {
    const { body } = getValidatedData(response);

    const review = await createAdminReview(
      body as CreateAdminReviewInput,
      getAdminId(response),
      getAuditContext(request)
    );

    response.status(201).json({
      success: true,
      message: "Review submitted for moderation successfully.",
      data: review
    });
  };

/*
|--------------------------------------------------------------------------
| List reviews
|--------------------------------------------------------------------------
*/

export const getReviewsHandler: RequestHandler =
  async (_request, response) => {
    const { query } = getValidatedData(response);

    const result = await getReviews(
      query as ListReviewsQuery
    );

    response.status(200).json({
      success: true,
      message: "Reviews retrieved successfully.",
      data: result
    });
  };

/*
|--------------------------------------------------------------------------
| Get individual review
|--------------------------------------------------------------------------
*/

export const getReviewHandler: RequestHandler =
  async (_request, response) => {
    const { params } = getValidatedData(response);

    const review = await getReviewById(
      params!.reviewId!
    );

    response.status(200).json({
      success: true,
      message: "Review retrieved successfully.",
      data: review
    });
  };

/*
|--------------------------------------------------------------------------
| Moderate review
|--------------------------------------------------------------------------
*/

export const moderateReviewHandler: RequestHandler =
  async (request, response) => {
    const { params, body } = getValidatedData(response);

    const review = await moderateReview(
      params!.reviewId!,
      body as ModerateReviewInput,
      getAdminId(response),
      getAuditContext(request)
    );

    response.status(200).json({
      success: true,
      message: "Review moderated successfully.",
      data: review
    });
  };

/*
|--------------------------------------------------------------------------
| Public featured reviews
|--------------------------------------------------------------------------
*/

export const getFeaturedReviewsHandler: RequestHandler =
  async (_request, response) => {
    const reviews = await getFeaturedReviews();

    response.status(200).json({
      success: true,
      message: "Featured reviews retrieved successfully.",
      data: reviews
    });
  };
