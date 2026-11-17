import { apiRequest } from "../../../lib/api.js";

import type {
  IAdminService,
  IAdminServiceCategoryDetails,
  IAdminServiceCategoryListResponse,
  IAdminServiceForm,
  IAdminServiceFormListResponse,
  IAdminServiceFormOverview,
  IAdminServiceListResponse,
  ICreateServiceInput,
  ICreateServiceCategoryInput,
  ICreateServiceFormInput,
  IDeleteServiceResponse,
  IDeleteServiceCategoryResponse,
  IServiceListParams,
  IServiceCategoryListParams,
  IServiceDetailsResponse,
  IServiceFormResponse,
  IUpdateServiceInput,
  IUpdateServiceStatusInput,
  IUpdateServiceCategoryInput,
  IUpdateServiceCategoryStatusInput,
  IUpdateServiceFormInput,
  IServicesResponse
} from "../types/service.type.js";

function buildCategoryQuery(
  params: IServiceCategoryListParams
): string {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.isActive !== undefined) {
    searchParams.set("isActive", String(params.isActive));
  }

  if (params.includeDeleted !== undefined) {
    searchParams.set(
      "includeDeleted",
      String(params.includeDeleted)
    );
  }

  searchParams.set("sortBy", params.sortBy ?? "displayOrder");
  searchParams.set("sortOrder", params.sortOrder ?? "asc");

  return searchParams.toString();
}

function buildServiceQuery(
  params: IServiceListParams
): string {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.categoryId) {
    searchParams.set("categoryId", params.categoryId);
  }

  if (params.isActive !== undefined) {
    searchParams.set("isActive", String(params.isActive));
  }

  if (params.includeDeleted !== undefined) {
    searchParams.set(
      "includeDeleted",
      String(params.includeDeleted)
    );
  }

  searchParams.set("sortBy", params.sortBy ?? "displayOrder");
  searchParams.set("sortOrder", params.sortOrder ?? "asc");

  return searchParams.toString();
}

// Public services

export async function getPublicServices(): Promise<IServicesResponse> {
  return apiRequest<IServicesResponse>("/services");
}

export async function getPublicService(
  serviceId: string
): Promise<IServiceDetailsResponse> {
  return apiRequest<IServiceDetailsResponse>(
    `/services/${encodeURIComponent(serviceId)}`
  );
}

export async function getPublicServiceForm(
  serviceId: string
): Promise<IServiceFormResponse> {
  return apiRequest<IServiceFormResponse>(
    `/services/${encodeURIComponent(serviceId)}/form`
  );
}

// Admin service categories

export async function getAdminServiceCategories(
  params: IServiceCategoryListParams
): Promise<IAdminServiceCategoryListResponse> {
  const query = buildCategoryQuery(params);

  return apiRequest<IAdminServiceCategoryListResponse>(
    `/service-categories?${query}`
  );
}

export async function getAdminServiceCategoryById(
  categoryId: string
): Promise<IAdminServiceCategoryDetails> {
  return apiRequest<IAdminServiceCategoryDetails>(
    `/service-categories/${encodeURIComponent(categoryId)}`
  );
}

export async function createServiceCategory(
  input: ICreateServiceCategoryInput
): Promise<IAdminServiceCategoryDetails> {
  return apiRequest<IAdminServiceCategoryDetails>(
    "/service-categories",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function updateServiceCategory(
  categoryId: string,
  input: IUpdateServiceCategoryInput
): Promise<IAdminServiceCategoryDetails> {
  return apiRequest<IAdminServiceCategoryDetails>(
    `/service-categories/${encodeURIComponent(categoryId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}

export async function updateServiceCategoryStatus(
  categoryId: string,
  input: IUpdateServiceCategoryStatusInput
): Promise<IAdminServiceCategoryDetails> {
  return apiRequest<IAdminServiceCategoryDetails>(
    `/service-categories/${encodeURIComponent(categoryId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}

export async function deleteServiceCategory(
  categoryId: string
): Promise<IDeleteServiceCategoryResponse> {
  return apiRequest<IDeleteServiceCategoryResponse>(
    `/service-categories/${encodeURIComponent(categoryId)}`,
    {
      method: "DELETE"
    }
  );
}

// Admin services

export async function getAdminServices(
  params: IServiceListParams
): Promise<IAdminServiceListResponse> {
  const query = buildServiceQuery(params);

  return apiRequest<IAdminServiceListResponse>(
    `/admin/services?${query}`
  );
}

export async function getAdminServiceById(
  serviceId: string
): Promise<IAdminService> {
  return apiRequest<IAdminService>(
    `/admin/services/${encodeURIComponent(serviceId)}`
  );
}

export async function createService(
  input: ICreateServiceInput
): Promise<IAdminService> {
  return apiRequest<IAdminService>("/admin/services", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateService(
  serviceId: string,
  input: IUpdateServiceInput
): Promise<IAdminService> {
  return apiRequest<IAdminService>(
    `/admin/services/${encodeURIComponent(serviceId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}

export async function updateServiceStatus(
  serviceId: string,
  input: IUpdateServiceStatusInput
): Promise<IAdminService> {
  return apiRequest<IAdminService>(
    `/admin/services/${encodeURIComponent(serviceId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}

export async function deleteService(
  serviceId: string
): Promise<IDeleteServiceResponse> {
  return apiRequest<IDeleteServiceResponse>(
    `/admin/services/${encodeURIComponent(serviceId)}`,
    {
      method: "DELETE"
    }
  );
}

// Admin service forms

export async function getAdminServiceForm(
  serviceId: string
): Promise<IAdminServiceFormOverview> {
  return apiRequest<IAdminServiceFormOverview>(
    `/admin/services/${encodeURIComponent(serviceId)}/form`
  );
}

export async function getAdminServiceFormVersions(
  serviceId: string
): Promise<IAdminServiceFormListResponse> {
  return apiRequest<IAdminServiceFormListResponse>(
    `/admin/services/${encodeURIComponent(serviceId)}/forms`
  );
}

export async function getAdminServiceFormVersion(
  serviceId: string,
  formId: string
): Promise<IAdminServiceForm> {
  return apiRequest<IAdminServiceForm>(
    `/admin/services/${encodeURIComponent(serviceId)}/forms/${encodeURIComponent(formId)}`
  );
}

export async function createServiceForm(
  serviceId: string,
  input: ICreateServiceFormInput
): Promise<IAdminServiceForm> {
  return apiRequest<IAdminServiceForm>(
    `/admin/services/${encodeURIComponent(serviceId)}/forms`,
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function updateServiceForm(
  serviceId: string,
  formId: string,
  input: IUpdateServiceFormInput
): Promise<IAdminServiceForm> {
  return apiRequest<IAdminServiceForm>(
    `/admin/services/${encodeURIComponent(serviceId)}/forms/${encodeURIComponent(formId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input)
    }
  );
}

export async function publishServiceForm(
  serviceId: string,
  formId: string
): Promise<IAdminServiceForm> {
  return apiRequest<IAdminServiceForm>(
    `/admin/services/${encodeURIComponent(serviceId)}/forms/${encodeURIComponent(formId)}/publish`,
    {
      method: "POST"
    }
  );
}