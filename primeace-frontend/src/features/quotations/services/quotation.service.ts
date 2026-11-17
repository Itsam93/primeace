import {
  apiRequest,
  apiRequestWithMeta
} from "../../../lib/api.js";

import type {
  IQuotation,
  IQuotationCreateInput,
  IQuotationListParams,
  IQuotationPaginationMeta,
  IQuotationResponse,
  IQuotationUpdateInput
} from "../types/quotation.types.js";

interface IQuotationIssueResult {
  quotation: IQuotation;
  accessToken: string;
}

function buildQuotationQuery(
  params: IQuotationListParams
): string {
  const query = new URLSearchParams();

  query.set("page", String(params.page));
  query.set("limit", String(params.limit));

  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.clientId) query.set("clientId", params.clientId);

  if (params.serviceRequestId) {
    query.set("serviceRequestId", params.serviceRequestId);
  }

  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.sortBy) query.set("sortBy", params.sortBy);

  if (params.sortOrder) {
    query.set("sortOrder", params.sortOrder);
  }

  return query.toString();
}

export async function getQuotations(
  params: IQuotationListParams
) {
  const query = buildQuotationQuery(params);

  const result = await apiRequestWithMeta<
    IQuotation[],
    IQuotationPaginationMeta
  >(`/quotations?${query}`);

  return {
    quotations: result.data,
    pagination: result.meta
  };
}

export async function getQuotationById(
  quotationId: string
): Promise<IQuotation> {
  return apiRequest<IQuotation>(
    `/quotations/${encodeURIComponent(quotationId)}`
  );
}

export async function createQuotation(
  input: IQuotationCreateInput
): Promise<IQuotation> {
  return apiRequest<IQuotation>("/quotations", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateQuotationDraft(
  quotationId: string,
  input: IQuotationUpdateInput
): Promise<IQuotation> {
  return apiRequest<IQuotation>(
    `/quotations/${encodeURIComponent(quotationId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}

export async function issueQuotation(
  quotationId: string
): Promise<IQuotationIssueResult> {
  return apiRequest<IQuotationIssueResult>(
    `/quotations/${encodeURIComponent(quotationId)}/issue`,
    {
      method: "POST"
    }
  );
}

export async function withdrawQuotation(
  quotationId: string
): Promise<IQuotation> {
  return apiRequest<IQuotation>(
    `/quotations/${encodeURIComponent(quotationId)}/withdraw`,
    {
      method: "POST"
    }
  );
}

export async function createQuotationRevision(
  quotationId: string
): Promise<IQuotation> {
  return apiRequest<IQuotation>(
    `/quotations/${encodeURIComponent(quotationId)}/revisions`,
    {
      method: "POST"
    }
  );
}

/* Public quotation access */

export async function getPublicQuotation(
  token: string
): Promise<IQuotation> {
  return apiRequest<IQuotation>(
    `/quotations/public/${encodeURIComponent(token)}`
  );
}

export async function respondToQuotation(
  token: string,
  input: IQuotationResponse
): Promise<void> {
  await apiRequest<unknown>(
    `/quotations/public/${encodeURIComponent(token)}/respond`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}
