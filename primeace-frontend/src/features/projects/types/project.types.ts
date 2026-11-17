import type {
  ProjectSource,
  ProjectStatus
} from "@primeace/shared";

export interface ProjectClientSnapshot {
  fullName: string;
  email: string | null;
  phone: string;
}

export interface ProjectListItem {
  id: string;
  projectReference: string;
  source: ProjectSource;
  clientSnapshot: ProjectClientSnapshot;
  serviceNames: string[];
  title: string;
  contractAmountKobo: number | null;
  status: ProjectStatus;
  startDate: string | null;
  expectedCompletionDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectListItem {
  clientId: string;
  serviceRequestId: string | null;
  quotationId: string | null;
  contractId: string | null;
  description: string;
  completedAt: string | null;
}

export interface ProjectPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProjectListResponse {
  projects: ProjectListItem[];
  pagination: ProjectPagination;
}

export interface IListProjectsQuery {
  page?: number;
  limit?: number;
  search?: string;
  source?: ProjectSource;
  status?: ProjectStatus;
  clientId?: string;
  serviceRequestId?: string;
  quotationId?: string;
  contractId?: string;
  from?: string;
  to?: string;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "projectReference"
    | "title"
    | "status"
    | "contractAmountKobo"
    | "expectedCompletionDate";
  sortOrder?: "asc" | "desc";
}

export interface ICreateHistoricalProjectPayload {
  clientId: string;
  title: string;
  description: string;
  serviceNames: string[];
  contractAmountKobo: number | null;
  startDate: string | null;
  expectedCompletionDate: string | null;
  completedAt: string;
  status: ProjectStatus;
}
