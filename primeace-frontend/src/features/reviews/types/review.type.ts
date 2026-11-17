import type {
  ReviewStatus,
  ReviewDisplayPreference,
  ReviewSubmissionMethod
} from "@primeace/shared";

export interface IReviewProject {
  _id: string;
  projectReference: string;
  title: string;
  status?: string;
}

export interface IReviewClient {
  _id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
}

export interface IReviewAdmin {
  _id: string;
  fullName: string;
  email: string;
}

export interface IAdminReview {
  _id: string;
  projectId: IReviewProject | string;
  clientId: IReviewClient | string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  displayPreference: ReviewDisplayPreference;
  displayName: string | null;
  consentToPublish: boolean;
  submissionMethod: ReviewSubmissionMethod;
  submittedBy: IReviewAdmin | string | null;
  status: ReviewStatus;
  isFeatured: boolean;
  submittedAt: string;
  moderatedAt: string | null;
  moderatedBy?: IReviewAdmin | string | null;
  moderationNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IReviewPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IReviewListResponse {
  reviews: IAdminReview[];
  pagination: IReviewPagination;
}

export interface IReviewListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReviewStatus;
  submissionMethod?: ReviewSubmissionMethod;
}

export interface IEligibleReviewProject {
  _id: string;
  projectReference: string;
  title: string;
  clientId: string;
  clientSnapshot: {
    fullName: string;
    email: string;
    phone: string;
  };
  completedAt: string | null;
}

export interface ICreateAdminReviewInput {
  projectId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  displayPreference: ReviewDisplayPreference;
  consentToPublish: true;
}

export interface IModerateReviewInput {
  status: Exclude<ReviewStatus, "pending">;
  isFeatured?: boolean;
  moderationNote?: string | null;
}
