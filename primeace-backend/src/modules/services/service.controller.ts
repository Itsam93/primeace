import type {
  Request,
  RequestHandler,
  Response
} from "express";

import { ApiError } from "../../shared/errors/ApiError.js";

import {
  createService,
  deleteService,
  getPublicService,
  getPublicServiceForm,
  getPublicServices,
  getServiceById,
  listServices,
  updateService,
  updateServiceStatus
} from "./service.service.js";

import type {
  CreateServiceInput,
  GetServiceParams,
  ListServicesQuery,
  UpdateServiceInput,
  UpdateServiceStatusInput
} from "./service.validation.js";

interface AdminContext {
  _id: string;
}

interface ValidatedRequest {
  body?: unknown;
  params?: unknown;
  query?: unknown;
}

function getValidatedData<T>(response: Response): T {
  return response.locals.validated as T;
}

function getValidatedBody<T>(response: Response): T {
  const validated = getValidatedData<ValidatedRequest>(response);
  return validated.body as T;
}

function getValidatedParams<T>(response: Response): T {
  const validated = getValidatedData<ValidatedRequest>(response);
  return validated.params as T;
}

function getValidatedQuery<T>(response: Response): T {
  const validated = getValidatedData<ValidatedRequest>(response);
  return validated.query as T;
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

// Public handlers

export const getPublicServicesHandler: RequestHandler = async (
  _request,
  response
) => {
  const data = await getPublicServices();

  response.status(200).json({
    success: true,
    message: "Services retrieved successfully.",
    data
  });
};

export const getPublicServiceHandler: RequestHandler = async (
  _request,
  response
) => {
  const { serviceId } = getValidatedParams<GetServiceParams>(response);

  const data = await getPublicService(serviceId);

  response.status(200).json({
    success: true,
    message: "Service retrieved successfully.",
    data
  });
};

export const getPublicServiceFormHandler: RequestHandler = async (
  _request,
  response
) => {
  const { serviceId } = getValidatedParams<GetServiceParams>(response);

  const data = await getPublicServiceForm(serviceId);

  response.status(200).json({
    success: true,
    message: "Service form retrieved successfully.",
    data
  });
};

// Admin handlers

export const createServiceController: RequestHandler = async (
  request,
  response
) => {
  const input = getValidatedBody<CreateServiceInput>(response);

  const data = await createService({
    input,
    adminId: getAdminId(response),
    auditMetadata: getAuditMetadata(request)
  });

  response.status(201).json({
    success: true,
    message: "Service created successfully.",
    data
  });
};

export const listServicesController: RequestHandler = async (
  _request,
  response
) => {
  const query = getValidatedQuery<ListServicesQuery>(response);

  const data = await listServices(query);

  response.status(200).json({
    success: true,
    message: "Services retrieved successfully.",
    data
  });
};

export const getServiceController: RequestHandler = async (
  _request,
  response
) => {
  const { serviceId } = getValidatedParams<GetServiceParams>(response);

  const data = await getServiceById(serviceId);

  response.status(200).json({
    success: true,
    message: "Service retrieved successfully.",
    data
  });
};

export const updateServiceController: RequestHandler = async (
  request,
  response
) => {
  const { serviceId } = getValidatedParams<GetServiceParams>(response);
  const input = getValidatedBody<UpdateServiceInput>(response);

  const data = await updateService({
    serviceId,
    input,
    adminId: getAdminId(response),
    auditMetadata: getAuditMetadata(request)
  });

  response.status(200).json({
    success: true,
    message: "Service updated successfully.",
    data
  });
};

export const updateServiceStatusController: RequestHandler = async (
  request,
  response
) => {
  const { serviceId } = getValidatedParams<GetServiceParams>(response);
  const input = getValidatedBody<UpdateServiceStatusInput>(response);

  const data = await updateServiceStatus({
    serviceId,
    input,
    adminId: getAdminId(response),
    auditMetadata: getAuditMetadata(request)
  });

  response.status(200).json({
    success: true,
    message: "Service status updated successfully.",
    data
  });
};

export const deleteServiceController: RequestHandler = async (
  request,
  response
) => {
  const { serviceId } = getValidatedParams<GetServiceParams>(response);

  const data = await deleteService({
    serviceId,
    adminId: getAdminId(response),
    auditMetadata: getAuditMetadata(request)
  });

  response.status(200).json({
    success: true,
    message: "Service deleted successfully.",
    data
  });
};
