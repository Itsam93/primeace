import {
  apiRequest,
  apiRequestWithMeta
} from "../../../lib/api.js";

import type {
  IClient,
  IClientDetailsResponse,
  IClientListParams,
  IClientPaginationMeta,
  ICreateClientPayload
} from "../types/client.types.js";

export async function createClient(
  payload: ICreateClientPayload
): Promise<IClient> {
  return apiRequest<IClient>(
    "/clients",
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function getClients(
  params: IClientListParams
): Promise<{
  clients: IClient[];
  pagination: IClientPaginationMeta;
}> {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.search) {
    searchParams.set("search", params.search);
  }

  searchParams.set(
    "sortBy",
    params.sortBy ?? "createdAt"
  );

  searchParams.set(
    "sortOrder",
    params.sortOrder ?? "desc"
  );

  const result = await apiRequestWithMeta<
    IClient[],
    IClientPaginationMeta
  >(
    `/clients?${searchParams.toString()}`
  );

  return {
    clients: result.data,
    pagination: result.meta
  };
}

export async function getClientById(
  clientId: string
): Promise<IClientDetailsResponse> {
  return apiRequest<IClientDetailsResponse>(
    `/clients/${encodeURIComponent(clientId)}`
  );
}
