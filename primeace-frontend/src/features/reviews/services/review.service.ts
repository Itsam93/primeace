import { apiRequest } from "../../../lib/api.js";

import type {
  IAdminReview,
  ICreateAdminReviewInput,
  IEligibleReviewProject,
  IModerateReviewInput,
  IReviewListParams,
  IReviewListResponse
} from "../types/review.type.js";

export async function getReviews(
  params: IReviewListParams = {}
): Promise<IReviewListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.submissionMethod) {
    searchParams.set("submissionMethod", params.submissionMethod);
  }

  const query = searchParams.toString();

  return apiRequest<IReviewListResponse>(
    `/reviews${query ? `?${query}` : ""}`
  );
}

export async function getReviewById(
  reviewId: string
): Promise<IAdminReview> {
  return apiRequest<IAdminReview>(
    `/reviews/${reviewId}`
  );
}

export async function getEligibleReviewProjects():
Promise<IEligibleReviewProject[]> {
  return apiRequest<IEligibleReviewProject[]>(
    "/reviews/eligible-projects"
  );
}

export async function createAdminReview(
  input: ICreateAdminReviewInput
): Promise<IAdminReview> {
  return apiRequest<IAdminReview>(
    "/reviews/admin",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function moderateReview(
  reviewId: string,
  input: IModerateReviewInput
): Promise<IAdminReview> {
  return apiRequest<IAdminReview>(
    `/reviews/${reviewId}/moderation`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}
