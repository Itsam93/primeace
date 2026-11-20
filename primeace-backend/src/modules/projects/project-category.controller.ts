import type {
  Request,
  RequestHandler,
  Response
} from "express";

import { ApiError } from "../../shared/errors/ApiError.js";

import {
  createProjectCategory,
  deleteProjectCategory,
  getProjectCategoryById,
  getPublicProjectCategories,
  listProjectCategories,
  updateProjectCategory,
  updateProjectCategoryStatus
} from "./project-category.service.js";

import type {
  CreateProjectCategoryInput,
  GetProjectCategoryParams,
  ListProjectCategoriesQuery,
  UpdateProjectCategoryInput,
  UpdateProjectCategoryStatusInput
} from "./project-category.validation.js";

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
  params: GetProjectCategoryParams;
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

export const createProjectCategoryController: RequestHandler = async (
  request,
  response
) => {
  const { body } = getValidatedData<
    ValidatedBody<CreateProjectCategoryInput>
  >(response);

  const data = await createProjectCategory({
    input: body,
    adminId: getAdminId(response),
    auditMetadata: getAuditMetadata(request)
  });

  response.status(201).json({
    success: true,
    message: "Project category created successfully.",
    data
  });
};

export const listProjectCategoriesController: RequestHandler = async (
  _request,
  response
) => {
  const { query } = getValidatedData<
    ValidatedQuery<ListProjectCategoriesQuery>
  >(response);

  const data = await listProjectCategories(query);

  response.status(200).json({
    success: true,
    message: "Project categories retrieved successfully.",
    data
  });
};

export const getProjectCategoryController: RequestHandler = async (
  _request,
  response
) => {
  const { params } = getValidatedData<
    ValidatedParams<GetProjectCategoryParams>
  >(response);

  const data = await getProjectCategoryById(params.categoryId);

  response.status(200).json({
    success: true,
    message: "Project category retrieved successfully.",
    data
  });
};

export const getPublicProjectCategoriesController: RequestHandler = async (
  _request,
  response
) => {
  const data = await getPublicProjectCategories();

  response.status(200).json({
    success: true,
    message: "Project categories retrieved successfully.",
    data
  });
};

export const updateProjectCategoryController: RequestHandler = async (
  request,
  response
) => {
  const validated = getValidatedData<
    ValidatedUpdate<UpdateProjectCategoryInput>
  >(response);

  const data = await updateProjectCategory({
    categoryId: validated.params.categoryId,
    input: validated.body,
    adminId: getAdminId(response),
    auditMetadata: getAuditMetadata(request)
  });

  response.status(200).json({
    success: true,
    message: "Project category updated successfully.",
    data
  });
};

export const updateProjectCategoryStatusController: RequestHandler = async (
  request,
  response
) => {
  const validated = getValidatedData<
    ValidatedUpdate<UpdateProjectCategoryStatusInput>
  >(response);

  const data = await updateProjectCategoryStatus({
    categoryId: validated.params.categoryId,
    input: validated.body,
    adminId: getAdminId(response),
    auditMetadata: getAuditMetadata(request)
  });

  response.status(200).json({
    success: true,
    message: "Project category status updated successfully.",
    data
  });
};

export const deleteProjectCategoryController: RequestHandler = async (
  request,
  response
) => {
  const { params } = getValidatedData<
    ValidatedParams<GetProjectCategoryParams>
  >(response);

  const data = await deleteProjectCategory({
    categoryId: params.categoryId,
    adminId: getAdminId(response),
    auditMetadata: getAuditMetadata(request)
  });

  response.status(200).json({
    success: true,
    message: "Project category deleted successfully.",
    data
  });
};