import type { ContractStatus } from "@primeace/shared";

export interface IContractClientSnapshot {
  fullName: string;
  email: string | null;
  phone: string;
}

export interface IContractItem {
  serviceName: string;
  description: string;
  deliverables: string[];
  quantity: number;
  unitAmountKobo: number;
  totalAmountKobo: number;
}

export interface IContract {
  _id: string;
  contractNumber: string;

  clientId: string;
  clientSnapshot: IContractClientSnapshot;

  serviceRequestId: string;
  quotationId: string;
  quotationNumber: string;

  projectId: string | null;

  version: number;
  previousVersionId: string | null;

  title: string;
  scope: string;

  items: IContractItem[];
  deliverables: string[];

  contractAmountKobo: number;
  terms: string[];

  startDate: string | null;
  expectedCompletionDate: string | null;

  status: ContractStatus;

  issuedAt: string | null;
  acceptanceDeadline: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface IContractAcceptance {
  _id: string;
  contractId: string;
  contractVersion: number;

  acceptedBy: string;
  acceptedAt: string;
  agreementConfirmed: true;

  acceptedDocumentFileId: string | null;

  evidence: {
    ipAddress: string | null;
    userAgent: string | null;
  };
}

export interface IContractDetails {
  contract: IContract;
  acceptance: IContractAcceptance | null;
  revisions: IContract[];
}

export interface ICreateContractInput {
  quotationId: string;
  title: string;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  acceptanceDeadline?: string | null;
}

export interface IUpdateContractInput {
  title?: string;
  scope?: string;
  deliverables?: string[];
  terms?: string[];
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  acceptanceDeadline?: string | null;
}

export interface IListContractsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContractStatus;
  clientId?: string;
  quotationId?: string;
  serviceRequestId?: string;
  from?: string;
  to?: string;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "contractNumber"
    | "contractAmountKobo"
    | "status"
    | "expectedCompletionDate";
  sortOrder?: "asc" | "desc";
}

export interface IContractPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IListContractsResponse {
  contracts: IContract[];
  pagination: IContractPagination;
}

export interface IIssueContractResponse {
  contract: IContract;
  accessToken: string;
}

export interface IContractClientAcceptanceInput {
  response: "accepted";
  acceptedBy: string;
  agreementConfirmed: true;
  acceptedDocumentFileId?: string | null;
}

export interface IContractClientRejectionInput {
  response: "rejected";
}

export type IContractClientResponseInput =
  | IContractClientAcceptanceInput
  | IContractClientRejectionInput;

export interface IContractApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}