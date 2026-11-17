import type {
  QuotationStatus,
  ContractStatus,
  ProjectStatus,
  ProjectSource
} from "@primeace/shared";

import type {
  ServiceRequestStatus
} from "../../service-requests/types/serviceRequest.types.js";

export interface IClient {
  _id: string;
  fullName: string;
  email: string | null;
  phone: string;
  organisation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateClientPayload {
  fullName: string;
  email?: string;
  phone: string;
  organisation?: string;
}

export interface IClientListParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: "fullName" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface IClientPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IClientServiceRequestItem {
  _id: string;
  serviceName: string;
  categoryName: string;
}

export interface IClientServiceRequest {
  _id: string;
  reference: string;
  items: IClientServiceRequestItem[];
  status: ServiceRequestStatus;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IClientQuotationItem {
  _id: string;
  serviceRequestItemId: string | null;
  serviceName: string;
  description: string;
  deliverables: string[];
  quantity: number;
  unitAmountKobo: number;
  totalAmountKobo: number;
}

export interface IClientQuotation {
  _id: string;
  quotationNumber: string;
  clientId: string;
  serviceRequestId: string;
  serviceRequestReference: string;
  version: number;
  previousVersionId: string | null;
  items: IClientQuotationItem[];
  subtotalKobo: number;
  discountKobo: number;
  totalAmountKobo: number;
  scope: string;
  terms: string[];
  validUntil: string;
  status: QuotationStatus;
  issuedAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IClientQuotationGroup {
  quotationNumber: string;
  latestVersion: IClientQuotation | null;
  revisions: IClientQuotation[];
}

export interface IClientContractItem {
  serviceName: string;
  description: string;
  deliverables: string[];
  quantity: number;
  unitAmountKobo: number;
  totalAmountKobo: number;
}

export interface IClientContract {
  _id: string;
  contractNumber: string;
  clientId: string;
  serviceRequestId: string;
  quotationId: string;
  quotationNumber: string;
  projectId: string | null;
  version: number;
  previousVersionId: string | null;
  title: string;
  scope: string;
  items: IClientContractItem[];
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

export interface IClientContractGroup {
  contractNumber: string;
  latestVersion: IClientContract | null;
  revisions: IClientContract[];
}

export interface IClientProject {
  _id: string;
  projectReference: string;
  source: ProjectSource;
  serviceNames: string[];
  title: string;
  description: string;
  contractAmountKobo: number | null;
  status: ProjectStatus;
  startDate: string | null;
  expectedCompletionDate: string | null;
  completedAt: string | null;
  serviceRequestId: string | null;
  quotationId: string | null;
  contractId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IClientDetailsResponse {
  client: IClient;
  serviceRequests: IClientServiceRequest[];
  quotations: IClientQuotationGroup[];
  contracts: IClientContractGroup[];
  projects: IClientProject[];
}
