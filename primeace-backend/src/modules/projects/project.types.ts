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

  contractAmountKobo: number | null;

  status: ProjectStatus;

  startDate: string | null;
  expectedCompletionDate: string | null;
  completedAt: string | null;

  coverImage: ProjectCoverImage | null;
  videoClip: ProjectVideoClip | null;

  isFeatured: boolean;

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

/**
 * Project information exposed on the public website.
 *
 * Excludes client information, financial details,
 * internal references and administrative fields.
 */
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
