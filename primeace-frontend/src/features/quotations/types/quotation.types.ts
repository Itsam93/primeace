import type { QuotationStatus } from "@primeace/shared";

export interface IQuotationClientSnapshot {
  fullName: string;
  email: string | null;
  phone: string;
}

export interface IQuotationItem {
  _id: string;
  serviceRequestItemId: string | null;
  serviceName: string;
  description: string;
  deliverables: string[];
  quantity: number;
  unitAmountKobo: number;
  totalAmountKobo: number;
}

export interface IQuotation {
  _id: string;
  quotationNumber: string;
  clientId: string;
  clientSnapshot: IQuotationClientSnapshot;
  serviceRequestId: string;
  serviceRequestReference: string;
  version: number;
  previousVersionId: string | null;
  items: IQuotationItem[];
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

export interface IQuotationGroup {
  quotationNumber: string;
  latestVersion: IQuotation;
  revisions: IQuotation[];
}

export interface IQuotationPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IQuotationListParams {
  page: number;
  limit: number;
  search?: string;
  status?: QuotationStatus;
  clientId?: string;
  serviceRequestId?: string;
  from?: string;
  to?: string;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "quotationNumber"
    | "validUntil"
    | "totalAmountKobo"
    | "status";
  sortOrder?: "asc" | "desc";
}

export interface IQuotationLineItemInput {
  serviceRequestItemId: string | null;
  serviceName: string;
  description: string;
  deliverables: string[];
  quantity: number;
  unitAmountKobo: number;
}

export interface IQuotationCreateInput {
  serviceRequestId: string;
  items: IQuotationLineItemInput[];
  discountKobo: number;
  scope: string;
  terms: string[];
  validUntil: string;
}

export type IQuotationUpdateInput = Partial<
  Omit<IQuotationCreateInput, "serviceRequestId">
>;

export interface IQuotationResponse {
  response: "approved" | "declined" | "revision_requested";
  comments?: string;
}
