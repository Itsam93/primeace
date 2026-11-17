import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { ApiError } from "../../shared/errors/ApiError.js";

import {
  createHistoricalProject,
  getProjectById,
  getProjects,
  updateProjectStatus
} from "./project.service.js";

import type {
  CreateHistoricalProjectInput,
  ListProjectsQuery,
  UpdateProjectStatusInput
} from "./project.validation.js";

interface ValidatedRequestData {
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}

interface AuthenticatedAdmin {
  _id: Types.ObjectId;
}

function getValidatedData(
  response: Parameters<RequestHandler>[1]
): ValidatedRequestData {
  const validated = response.locals.validated as
    | ValidatedRequestData
    | undefined;

  if (!validated) {
    throw new ApiError(
      500,
      "Validated request data is unavailable."
    );
  }

  return validated;
}

function getAuthenticatedAdmin(
  response: Parameters<RequestHandler>[1]
): AuthenticatedAdmin {
  const admin = response.locals.admin as
    | AuthenticatedAdmin
    | undefined;

  if (!admin?._id) {
    throw new ApiError(
      401,
      "Authenticated administrator information is unavailable."
    );
  }

  return admin;
}

/**
 * Retrieve all projects with pagination and filtering.
 */
export const getAllProjects: RequestHandler = async (
  _request,
  response
) => {
  const { query } = getValidatedData(response);

  if (!query) {
    throw new ApiError(
      500,
      "Validated project query is unavailable."
    );
  }

  const result = await getProjects(
    query as ListProjectsQuery
  );

  response.status(200).json({
    success: true,
    message: "Projects retrieved successfully.",
    data: result
  });
};

/**
 * Retrieve an individual project by its database ID.
 */
export const getProject: RequestHandler = async (
  _request,
  response
) => {
  const { params } = getValidatedData(response);

  const projectId = params?.projectId;

  if (!projectId) {
    throw new ApiError(
      400,
      "Project ID is required."
    );
  }

  const project = await getProjectById(projectId);

  response.status(200).json({
    success: true,
    message: "Project retrieved successfully.",
    data: project
  });
};

/**
 * Create a historical project manually.
 *
 * This is intended for projects completed or handled
 * before the PrimeAce application was introduced.
 */
export const createHistoricalProjectHandler: RequestHandler = async (
  request,
  response
) => {
  const { body } = getValidatedData(response);

  if (!body) {
    throw new ApiError(
      400,
      "Validated historical project data is unavailable."
    );
  }

  const admin = getAuthenticatedAdmin(response);

  const project = await createHistoricalProject(
    body as CreateHistoricalProjectInput,
    {
      actorId: admin._id,
      ipAddress: request.ip ?? null,
      userAgent: request.get("user-agent") ?? null
    }
  );

  response.status(201).json({
    success: true,
    message: "Historical project created successfully.",
    data: project
  });
};

/**
 * Update a project's status.
 */
export const updateProjectStatusHandler: RequestHandler = async (
  request,
  response
) => {
  const { params, body } = getValidatedData(response);

  const projectId = params?.projectId;

  if (!projectId) {
    throw new ApiError(
      400,
      "Project ID is required."
    );
  }

  if (!body) {
    throw new ApiError(
      400,
      "Validated project status is unavailable."
    );
  }

  const admin = getAuthenticatedAdmin(response);

  const project = await updateProjectStatus(
    projectId,
    body as UpdateProjectStatusInput,
    {
      actorId: admin._id,
      ipAddress: request.ip ?? null,
      userAgent: request.get("user-agent") ?? null
    }
  );

  response.status(200).json({
    success: true,
    message: "Project status updated successfully.",
    data: project
  });
};
