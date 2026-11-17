import type { ReviewInvitationStatus, ReviewStatus } from "@primeace/shared";

export interface IInvitationProject {
  _id: string;
  projectReference: string;
  title: string;
  status: string;
  completedAt: string | null;
  clientSnapshot: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface IInvitationClient {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface IInvitationReview {
  _id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  status: ReviewStatus;
  submittedAt: string;
}

export interface IReviewInvitation {
  _id: string;
  invitationReference: string;
  projectId: IInvitationProject | string;
  clientId: IInvitationClient | string;
  reviewId: IInvitationReview | string | null;
  status: ReviewInvitationStatus;
  sentAt: string | null;
  expiresAt: string;
  submittedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IReviewInvitationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IReviewInvitationListResponse {
  invitations: IReviewInvitation[];
  pagination: IReviewInvitationPagination;
}

export interface IReviewInvitationListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReviewInvitationStatus;
}

export interface ICreateReviewInvitationInput {
  projectId: string;
}

export interface IReviewInvitationEmailResult {
  sent: boolean;
  sentAt: string | null;
  message: string;
}

export interface IReviewInvitationDeliveryResponse {
  invitation: IReviewInvitation;
  email: IReviewInvitationEmailResult;
}

export interface IReviewInvitationResendResponse {
  email: IReviewInvitationEmailResult;
}

export interface IPublicReviewInvitation {
  invitationReference: string;
  expiresAt: string;
  project: {
    projectReference: string;
    title: string;
    clientName: string;
  };
}

export interface ISubmitClientReviewInput {
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  displayPreference: "full_name" | "first_name" | "anonymous";
  consentToPublish: boolean;
}

export interface ISubmitClientReviewResponse {
  id: string;
  rating: number;
  status: ReviewStatus;
  submittedAt: string;
}
