import type {
  Request,
  RequestHandler,
  Response
} from "express";

import { ApiError } from "../../shared/errors/ApiError.js";

import {
  createServiceCategory,
  deleteServiceCategory,
  getServiceCategoryById,
  listServiceCategories,
  updateServiceCategory,
  updateServiceCategoryStatus
} from "./serviceCategory.service.js";

import type {
  CreateServiceCategoryInput,
  GetServiceCategoryParams,
  ListServiceCategoriesQuery,
  UpdateServiceCategoryInput,
  UpdateServiceCategoryStatusInput
} from "./serviceCategory.validation.js";

interface AdminContext {
  _id: string;
}

interface ValidatedBody<T> {
  body: T;
}

interface ValidatedParams<T> {
  params: T;
}

interface ValidatedQuery<T> {
  query: T;
}

interface ValidatedUpdate<T> {
  params: GetServiceCategoryParams;
  body: T;
}

function getValidatedData<T>(response: Response): T {
  return response.locals.validated as T;
}

function getAdminId(response: Response): string {
  const admin = response.locals.admin as AdminContext | undefined;

  if (!admin?._id) {
    throw new ApiError(
      401,
      "Administrator authentication is required."
    );
  }

  return admin._id;
}

function getAuditMetadata(request: Request) {
  return {
    ipAddress: request.ip ?? null,
    userAgent: request.get("user-agent") ?? null
  };
}

export const createServiceCategoryController: RequestHandler = async (
  request,
  response
) => {
  const { body } = getValidatedData<
    ValidatedBody<CreateServiceCategoryInput>
  >(response);

  const data = await createServiceCategory({
    input: body,
    adminId: getAdminId(response),
    auditMetadata: getAuditMetadata(request)
  });

  response.status(201).json({
    success: true,
    message: "Service category created successfully.",
    data
  });
};

export const listServiceCategoriesController: RequestHandler = async (
  _request,
  response
) => {
  const { query } = getValidatedData<
    ValidatedQuery<ListServiceCategoriesQuery>
  >(response);

  const data = await listServiceCategories(query);

  response.status(200).json({
    success: true,
    message: "Service categories retrieved successfully.",
    data
  });
};

export const getServiceCategoryController: RequestHandler = async (
  _request,
  response
) => {
  const { params } = getValidatedData<
    ValidatedParams<GetServiceCategoryParams>
  >(response);

  const data = await getServiceCategoryById(params.categoryId);

  response.status(200).json({
    success: true,
    message: "Service category retrieved successfully.",
    data
  });
};

export const updateServiceCategoryController: RequestHandler = async (
  request,
  response
) => {
  const validated = getValidatedData<
    ValidatedUpdate<UpdateServiceCategoryInput>
  >(response);

  const data = await updateServiceCategory({
    categoryId: validated.params.categoryId,
    input: validated.body,
    adminId: getAdminId(response),
    auditMetadata: getAuditMetadata(request)
  });

  response.status(200).json({
    success: true,
    message: "Service category updated successfully.",
    data
  });
};

export const updateServiceCategoryStatusController: RequestHandler = async (
  request,
  response
) => {
  const validated = getValidatedData<
    ValidatedUpdate<UpdateServiceCategoryStatusInput>
  >(response);

  const data = await updateServiceCategoryStatus({
    categoryId: validated.params.categoryId,
    input: validated.body,
    adminId: getAdminId(response),
    auditMetadata: getAuditMetadata(request)
  });

  response.status(200).json({
    success: true,
    message: "Service category status updated successfully.",
    data
  });

};

export const deleteServiceCategoryController: RequestHandler = async (
  request,
  response
) => {
  const { params } = getValidatedData<
    ValidatedParams<GetServiceCategoryParams>
  >(response);

  const data = await deleteServiceCategory({
    categoryId: params.categoryId,
    adminId: getAdminId(response),
    auditMetadata: getAuditMetadata(request)
  });

  response.status(200).json({
    success: true,
    message: "Service category deleted successfully.",
    data
  });
};
