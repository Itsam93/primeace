import { apiRequest } from "../../../lib/api.js";

import type {
  ICreateProjectCategoryPayload,
  IListProjectCategoriesQuery,
  IUpdateProjectCategoryPayload,
  IUpdateProjectCategoryStatusPayload,
  ProjectCategoryDetail,
  ProjectCategoryListResponse,
  PublicProjectCategoryListResponse
} from "../types/project.types.js";

const PROJECT_CATEGORIES_ENDPOINT = "/project-categories";
const PUBLIC_PROJECT_CATEGORIES_ENDPOINT =
  "/public/project-categories";

function buildQueryString(
  query: IListProjectCategoriesQuery
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

export async function getProjectCategories(
  query: IListProjectCategoriesQuery = {}
): Promise<ProjectCategoryListResponse> {
  return apiRequest<ProjectCategoryListResponse>(
    `${PROJECT_CATEGORIES_ENDPOINT}${buildQueryString(query)}`
  );
}

export async function getProjectCategoryById(
  categoryId: string
): Promise<ProjectCategoryDetail> {
  return apiRequest<ProjectCategoryDetail>(
    `${PROJECT_CATEGORIES_ENDPOINT}/${categoryId}`
  );
}

export async function createProjectCategory(
  categoryData: ICreateProjectCategoryPayload
): Promise<ProjectCategoryDetail> {
  return apiRequest<ProjectCategoryDetail>(
    PROJECT_CATEGORIES_ENDPOINT,
    {
      method: "POST",
      body: JSON.stringify(categoryData)
    }
  );
}

export async function updateProjectCategory(
  categoryId: string,
  categoryData: IUpdateProjectCategoryPayload
): Promise<ProjectCategoryDetail> {
  return apiRequest<ProjectCategoryDetail>(
    `${PROJECT_CATEGORIES_ENDPOINT}/${categoryId}`,
    {
      method: "PATCH",
      body: JSON.stringify(categoryData)
    }
  );
}

export async function updateProjectCategoryStatus(
  categoryId: string,
  statusData: IUpdateProjectCategoryStatusPayload
): Promise<ProjectCategoryDetail> {
  return apiRequest<ProjectCategoryDetail>(
    `${PROJECT_CATEGORIES_ENDPOINT}/${categoryId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(statusData)
    }
  );
}

export async function deleteProjectCategory(
  categoryId: string
): Promise<void> {
  return apiRequest<void>(
    `${PROJECT_CATEGORIES_ENDPOINT}/${categoryId}`,
    {
      method: "DELETE"
    }
  );
}

export async function getPublicProjectCategories(): Promise<PublicProjectCategoryListResponse> {
  return apiRequest<PublicProjectCategoryListResponse>(
    PUBLIC_PROJECT_CATEGORIES_ENDPOINT
  );
}
