import { apiRequest } from "../../../lib/api.js";

import type {
  ICreateReviewInvitationInput,
  IPublicReviewInvitation,
  IReviewInvitation,
  IReviewInvitationDeliveryResponse,
  IReviewInvitationListParams,
  IReviewInvitationListResponse,
  IReviewInvitationResendResponse,
  ISubmitClientReviewInput,
  ISubmitClientReviewResponse
} from "../types/reviewInvitation.type.js";

export async function getReviewInvitations(
  params: IReviewInvitationListParams = {}
): Promise<IReviewInvitationListResponse> {
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

  const query = searchParams.toString();

  return apiRequest<IReviewInvitationListResponse>(
    `/review-invitations${query ? `?${query}` : ""}`
  );
}

export async function getReviewInvitationById(
  invitationId: string
): Promise<IReviewInvitation> {
  return apiRequest<IReviewInvitation>(
    `/review-invitations/${invitationId}`
  );
}

export async function createReviewInvitation(
  input: ICreateReviewInvitationInput
): Promise<IReviewInvitationDeliveryResponse> {
  return apiRequest<IReviewInvitationDeliveryResponse>(
    "/review-invitations",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function resendReviewInvitation(
  invitationId: string
): Promise<IReviewInvitationResendResponse> {
  return apiRequest<IReviewInvitationResendResponse>(
    `/review-invitations/${invitationId}/resend`,
    {
      method: "POST"
    }
  );
}

export async function renewReviewInvitation(
  invitationId: string
): Promise<IReviewInvitationDeliveryResponse> {
  return apiRequest<IReviewInvitationDeliveryResponse>(
    `/review-invitations/${invitationId}/renew`,
    {
      method: "POST"
    }
  );
}

export async function revokeReviewInvitation(
  invitationId: string
): Promise<IReviewInvitation> {
  return apiRequest<IReviewInvitation>(
    `/review-invitations/${invitationId}/revoke`,
    {
      method: "POST"
    }
  );
}

export async function getPublicReviewInvitation(
  token: string
): Promise<IPublicReviewInvitation> {
  return apiRequest<IPublicReviewInvitation>(
    `/review-invitations/public/${token}`
  );
}

export async function submitClientReview(
  token: string,
  input: ISubmitClientReviewInput
): Promise<ISubmitClientReviewResponse> {
  return apiRequest<ISubmitClientReviewResponse>(
    `/review-invitations/public/${token}/submit`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}
