import { apiRequest, apiRequestWithMeta } from "../../../lib/api.js";

import type {
  ICreateServiceRequestNoteInput,
  IPaginatedResponse,
  IPaginationMeta,
  IServiceRequestDetails,
  IServiceRequestListItem,
  IServiceRequestListParams,
  IServiceRequestNote,
  IUpdateServiceRequestStatusInput
} from "./service-request.type.js";

function buildQueryString(
  params: IServiceRequestListParams & {
    page?: number;
    limit?: number;
  }
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

export async function getServiceRequests(
  params: IServiceRequestListParams = {}
): Promise<IPaginatedResponse<IServiceRequestListItem>> {
  const queryString = buildQueryString(params);

  const response = await apiRequestWithMeta<
    IServiceRequestListItem[],
    IPaginationMeta
  >(`/service-requests${queryString}`);

  return {
    data: response.data,
    meta: response.meta
  };
}

export async function getServiceRequestById(
  requestId: string
): Promise<IServiceRequestDetails> {
  return apiRequest<IServiceRequestDetails>(
    `/service-requests/${encodeURIComponent(requestId)}`
  );
}

export async function updateServiceRequestStatus(
  requestId: string,
  input: IUpdateServiceRequestStatusInput
): Promise<IServiceRequestDetails> {
  return apiRequest<IServiceRequestDetails>(
    `/service-requests/${encodeURIComponent(requestId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}

export async function getServiceRequestNotes(
  requestId: string,
  page = 1,
  limit = 20
): Promise<IPaginatedResponse<IServiceRequestNote>> {
  const queryString = buildQueryString({ page, limit });

  const response = await apiRequestWithMeta<
    IServiceRequestNote[],
    IPaginationMeta
  >(
    `/service-requests/${encodeURIComponent(requestId)}/notes${queryString}`
  );

  return {
    data: response.data,
    meta: response.meta
  };
}

export async function createServiceRequestNote(
  requestId: string,
  input: ICreateServiceRequestNoteInput
): Promise<IServiceRequestNote> {
  return apiRequest<IServiceRequestNote>(
    `/service-requests/${encodeURIComponent(requestId)}/notes`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}
