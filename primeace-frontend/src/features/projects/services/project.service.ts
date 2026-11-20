import { apiRequest } from "../../../lib/api.js";

import type {
  ICreateHistoricalProjectPayload,
  IListProjectsQuery,
  IUpdateProjectPayload,
  ProjectDetail,
  ProjectListResponse,
  PublicProjectListResponse
} from "../types/project.types.js";

const PROJECTS_ENDPOINT = "/projects";

function buildQueryString(
  query: IListProjectsQuery
): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export async function getProjects(
  query: IListProjectsQuery = {}
): Promise<ProjectListResponse> {
  return apiRequest<ProjectListResponse>(
    `${PROJECTS_ENDPOINT}${buildQueryString(query)}`
  );
}

export async function getProjectById(
  projectId: string
): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>(
    `${PROJECTS_ENDPOINT}/${projectId}`
  );
}

export async function createHistoricalProject(
  projectData: ICreateHistoricalProjectPayload
): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>(
    `${PROJECTS_ENDPOINT}/historical`,
    {
      method: "POST",
      body: JSON.stringify(projectData)
    }
  );
}

export async function updateProject(
  projectId: string,
  projectData: IUpdateProjectPayload
): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>(
    `${PROJECTS_ENDPOINT}/${projectId}`,
    {
      method: "PATCH",
      body: JSON.stringify(projectData)
    }
  );
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectDetail["status"]
): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>(
    `${PROJECTS_ENDPOINT}/${projectId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status })
    }
  );
}

export async function updateProjectFeatured(
  projectId: string,
  isFeatured: boolean
): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>(
    `${PROJECTS_ENDPOINT}/${projectId}/featured`,
    {
      method: "PATCH",
      body: JSON.stringify({ isFeatured })
    }
  );
}

export async function getFeaturedPublicProjects(): Promise<PublicProjectListResponse> {
  return apiRequest<PublicProjectListResponse>(
    `${PROJECTS_ENDPOINT}/featured`
  );
}
