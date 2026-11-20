import type {
  ProjectSource,
  ProjectStatus
} from "@primeace/shared";

export interface ProjectClientSnapshot {
  fullName: string;
  email: string | null;
  phone: string;
}

export interface ProjectCategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProjectCategoryListItem extends ProjectCategorySummary {
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCategoryDetail extends ProjectCategoryListItem {
  projectCount: number;
}

export interface ProjectCategoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProjectCategoryListResponse {
  categories: ProjectCategoryListItem[];
  pagination: ProjectCategoryPagination;
}

export interface PublicProjectCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

export interface PublicProjectCategoryListResponse {
  categories: PublicProjectCategory[];
}

export interface IListProjectCategoriesQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  sortBy?: "name" | "sortOrder" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ICreateProjectCategoryPayload {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
}

export interface IUpdateProjectCategoryPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number;
}

export interface IUpdateProjectCategoryStatusPayload {
  isActive: boolean;
}

export interface ProjectCoverImage {
  url: string;
  alt: string;
}

export interface ProjectVideoClip {
  url: string;
  thumbnailUrl: string;
  alt: string;
}

export interface ProjectListItem {
  id: string;
  projectReference: string;
  source: ProjectSource;
  clientSnapshot: ProjectClientSnapshot;
  serviceNames: string[];
  title: string;
  description: string;
  categoryId: string | null;
  category: ProjectCategorySummary | null;
  coverImage: ProjectCoverImage | null;
  videoClip: ProjectVideoClip | null;
  isFeatured: boolean;
  contractAmountKobo: number | null;
  status: ProjectStatus;
  startDate: string | null;
  expectedCompletionDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectListItem {
  clientId: string;
  serviceRequestId: string | null;
  quotationId: string | null;
  contractId: string | null;
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

export interface PublicProject {
  id: string;
  title: string;
  description: string;
  serviceNames: string[];
  category: ProjectCategorySummary | null;
  source: ProjectSource;
  completedAt: string | null;
  coverImage: ProjectCoverImage | null;
  videoClip: ProjectVideoClip | null;
}

export interface PublicProjectListResponse {
  projects: PublicProject[];
}

export interface IListProjectsQuery {
  page?: number;
  limit?: number;
  search?: string;
  source?: ProjectSource;
  status?: ProjectStatus;
  categoryId?: string;
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
  categoryId: string;
  serviceNames: string[];
  contractAmountKobo: number | null;
  startDate: string | null;
  expectedCompletionDate: string | null;
  completedAt: string;
  status: ProjectStatus;
}

export interface IUpdateProjectPayload {
  title?: string;
  description?: string;
  categoryId?: string;
  serviceNames?: string[];
  contractAmountKobo?: number | null;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
}
