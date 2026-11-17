import type {
  ID,
  ISODateString,
  IServiceFormField
} from "@primeace/shared";

// Public service types

export interface IService {
  _id: ID;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  deliverables: string[];
  displayOrder: number;
}

export interface IServiceCategory {
  _id: ID;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  services: IService[];
}

export interface IServicesResponse {
  categories: IServiceCategory[];
}

export interface IServiceFormResponse {
  serviceId: ID;
  version: number;
  publishedAt: ISODateString | null;
  fields: IServiceFormField[];
}

export interface IServiceDetailsResponse {
  service: IService;
  category: IServiceCategory;
}

export interface IServiceRequestContact {
  fullName: string;
  email?: string;
  phone: string;
  organisation?: string;
}

export interface ICreatePublicServiceRequest {
  client: IServiceRequestContact;
  items: {
    serviceId: ID;
    formVersion: number;
    answers: Record<string, unknown>;
  }[];
}

export interface IPublicServiceRequestConfirmation {
  reference: string;
  submittedAt: ISODateString;
  supportingDocumentsEmail: string;
}

// Admin service category types

export interface IAdminServiceCategory {
  _id: ID;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: ISODateString | null;
  deletedBy: ID | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface IAdminServiceCategoryDetails
  extends IAdminServiceCategory {
  serviceCount: number;
}

export interface IServiceCategoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IAdminServiceCategoryListResponse {
  categories: IAdminServiceCategory[];
  pagination: IServiceCategoryPagination;
}

export type ServiceCategorySortField =
  | "name"
  | "displayOrder"
  | "createdAt"
  | "updatedAt";

export interface IServiceCategoryListParams {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  sortBy?: ServiceCategorySortField;
  sortOrder?: "asc" | "desc";
}

export interface ICreateServiceCategoryInput {
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
}

export type IUpdateServiceCategoryInput =
  Partial<ICreateServiceCategoryInput>;

export interface IUpdateServiceCategoryStatusInput {
  isActive: boolean;
}

export interface IDeleteServiceCategoryResponse {
  categoryId: ID;
  deleted: boolean;
}

// Admin service types

export interface IAdminService {
  _id: ID;
  categoryId: ID;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  deliverables: string[];
  isActive: boolean;
  displayOrder: number;
  isDeleted: boolean;
  deletedAt: ISODateString | null;
  deletedBy: ID | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface IAdminServiceListResponse {
  services: IAdminService[];
  pagination: IServiceCategoryPagination;
}

export type ServiceSortField =
  | "name"
  | "displayOrder"
  | "createdAt"
  | "updatedAt";

export interface IServiceListParams {
  page: number;
  limit: number;
  search?: string;
  categoryId?: ID;
  isActive?: boolean;
  includeDeleted?: boolean;
  sortBy?: ServiceSortField;
  sortOrder?: "asc" | "desc";
}

export interface ICreateServiceInput {
  categoryId: ID;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  deliverables: string[];
  displayOrder: number;
}

export type IUpdateServiceInput = Partial<ICreateServiceInput>;

export interface IUpdateServiceStatusInput {
  isActive: boolean;
}

export interface IDeleteServiceResponse {
  serviceId: ID;
  deleted: boolean;
}

// Admin service form types

export interface IAdminServiceForm {
  _id: ID;
  serviceId: ID;
  version: number;
  fields: IServiceFormField[];
  isActive: boolean;
  publishedAt: ISODateString | null;
  createdBy: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface IAdminServiceFormOverview {
  activeForm: IAdminServiceForm | null;
  latestForm: IAdminServiceForm | null;
}

export interface IAdminServiceFormListResponse {
  forms: IAdminServiceForm[];
  total: number;
}

export interface ICreateServiceFormInput {
  fields: IServiceFormField[];
}

export type IUpdateServiceFormInput =
  ICreateServiceFormInput;
