import {
  apiRequest,
  apiRequestWithMeta
} from "../../../lib/api.js";

import type {
  IServiceRequestDetails,
  IServiceRequestListItem,
  IServiceRequestListParams,
  IServiceRequestNote,
  IServiceRequestNoteCreate,
  IServiceRequestPaginationMeta,
  IServiceRequestStatusUpdate
} from "../types/serviceRequest.types.js";

export async function getServiceRequests(
  params: IServiceRequestListParams
): Promise<{
  requests: IServiceRequestListItem[];
  pagination: IServiceRequestPaginationMeta;
}> {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.serviceId) {
    searchParams.set("serviceId", params.serviceId);
  }

  if (params.categoryId) {
    searchParams.set("categoryId", params.categoryId);
  }

  if (params.submittedFrom) {
    searchParams.set("submittedFrom", params.submittedFrom);
  }

  if (params.submittedTo) {
    searchParams.set("submittedTo", params.submittedTo);
  }

  searchParams.set(
    "sortBy",
    params.sortBy ?? "submittedAt"
  );

  searchParams.set(
    "sortOrder",
    params.sortOrder ?? "desc"
  );

  const result = await apiRequestWithMeta<
    IServiceRequestListItem[],
    IServiceRequestPaginationMeta
  >(
    `/service-requests?${searchParams.toString()}`
  );

  return {
    requests: result.data,
    pagination: result.meta
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
  payload: IServiceRequestStatusUpdate
): Promise<IServiceRequestDetails> {
  return apiRequest<IServiceRequestDetails>(
    `/service-requests/${encodeURIComponent(requestId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    }
  );
}

export async function getServiceRequestNotes(
  requestId: string,
  page = 1,
  limit = 20
): Promise<{
  notes: IServiceRequestNote[];
  pagination: IServiceRequestPaginationMeta;
}> {
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  const result = await apiRequestWithMeta<
    IServiceRequestNote[],
    IServiceRequestPaginationMeta
  >(
    `/service-requests/${encodeURIComponent(requestId)}/notes?${searchParams.toString()}`
  );

  return {
    notes: result.data,
    pagination: result.meta
  };
}

export async function createServiceRequestNote(
  requestId: string,
  payload: IServiceRequestNoteCreate
): Promise<IServiceRequestNote> {
  return apiRequest<IServiceRequestNote>(
    `/service-requests/${encodeURIComponent(requestId)}/notes`,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}
