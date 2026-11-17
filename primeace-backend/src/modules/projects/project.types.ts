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
