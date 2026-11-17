import { apiRequest } from "../../../lib/api";
import type { IPublicReview } from "@primeace/shared";

export async function getFeaturedReviews(): Promise<IPublicReview[]> {
  return apiRequest<IPublicReview[]>("/reviews/featured");
}