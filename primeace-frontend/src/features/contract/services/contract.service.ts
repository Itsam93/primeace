
import { apiRequest } from "../../../lib/api.js";

import type {
  IContract,
  IContractClientResponseInput,
  ICreateContractInput,
  IListContractsQuery,
  IListContractsResponse,
  IIssueContractResponse,
  IUpdateContractInput
} from "../types/contract.types.js";

const CONTRACTS_ENDPOINT = "/contracts";

function buildQueryString(
  query: IListContractsQuery
): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export async function createContract(
  input: ICreateContractInput
): Promise<IContract> {
  return apiRequest<IContract>(
    CONTRACTS_ENDPOINT,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function getContractById(
  contractId: string
): Promise<IContract> {
  return apiRequest<IContract>(
    `${CONTRACTS_ENDPOINT}/${encodeURIComponent(contractId)}`
  );
}

export async function updateContract(
  contractId: string,
  input: IUpdateContractInput
): Promise<IContract> {
  return apiRequest<IContract>(
    `${CONTRACTS_ENDPOINT}/${encodeURIComponent(contractId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}

export async function issueContract(
  contractId: string
): Promise<IIssueContractResponse> {
  return apiRequest<IIssueContractResponse>(
    `${CONTRACTS_ENDPOINT}/${encodeURIComponent(contractId)}/issue`,
    {
      method: "POST"
    }
  );
}

export async function withdrawContract(
  contractId: string
): Promise<IContract> {
  return apiRequest<IContract>(
    `${CONTRACTS_ENDPOINT}/${encodeURIComponent(contractId)}/withdraw`,
    {
      method: "POST"
    }
  );
}

export async function createContractRevision(
  contractId: string
): Promise<IContract> {
  return apiRequest<IContract>(
    `${CONTRACTS_ENDPOINT}/${encodeURIComponent(contractId)}/revisions`,
    {
      method: "POST"
    }
  );
}

export async function getPublicContract(
  accessToken: string
): Promise<IContract> {
  return apiRequest<IContract>(
    `${CONTRACTS_ENDPOINT}/public/${encodeURIComponent(accessToken)}`
  );
}

export async function respondToPublicContract(
  accessToken: string,
  input: IContractClientResponseInput
): Promise<IContract> {
  return apiRequest<IContract>(
    `${CONTRACTS_ENDPOINT}/public/${encodeURIComponent(accessToken)}/respond`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function getContracts(
  query: IListContractsQuery = {}
): Promise<IListContractsResponse> {
  return apiRequest<IListContractsResponse>(
    `${CONTRACTS_ENDPOINT}${buildQueryString(query)}`
  );
}
