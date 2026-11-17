import type {
  Request,
  RequestHandler,
  Response
} from "express";

import type { ValidatedRequest } from "../../middleware/validateRequest.js";

import { ApiError } from "../../shared/errors/ApiError.js";

import {
  createServiceForm,
  getServiceForm,
  getServiceFormVersion,
  listServiceForms,
  publishServiceForm,
  updateServiceForm
} from "./serviceForm.service.js";

import type {
  CreateServiceFormInput,
  UpdateServiceFormInput
} from "./serviceForm.validation.js";

function getValidatedData(
  response: Response
): {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
} {
  const validated = response.locals.validated;

  if (!validated) {
    throw new ApiError(
      500,
      "Validated request data is unavailable."
    );
  }

  return validated;
}

function getAdminId(response: Response): string {
  const admin = response.locals.admin;

  if (!admin?._id) {
    throw new ApiError(
      401,
      "Authenticated administrator information is unavailable."
    );
  }

  return admin._id.toString();
}

function getAuditMetadata(request: Request) {
  return {
    ipAddress: request.ip ?? null,
    userAgent: request.get("user-agent") ?? null
  };
}

function getValidatedParams<T extends Record<string, string>>(
  response: Response
): T {
  const validated = getValidatedData(response);

  if (!validated.params) {
    throw new ApiError(
      500,
      "Validated request parameters are unavailable."
    );
  }

  return validated.params as T;
}

function getValidatedBody<T>(response: Response): T {
  const validated = getValidatedData(response);

  if (validated.body === undefined) {
    throw new ApiError(
      500,
      "Validated request body is unavailable."
    );
  }

  return validated.body as T;
}

export const getServiceFormController: RequestHandler =
  async (_request, response) => {
    const { serviceId } = getValidatedParams<{
      serviceId: string;
    }>(response);

    const data = await getServiceForm(serviceId);

    response.status(200).json({
      success: true,
      message: "Service form retrieved successfully.",
      data
    });
  };

export const getServiceFormVersionController: RequestHandler =
  async (_request, response) => {
    const { serviceId, formId } = getValidatedParams<{
      serviceId: string;
      formId: string;
    }>(response);

    const data = await getServiceFormVersion({
      serviceId,
      formId
    });

    response.status(200).json({
      success: true,
      message: "Service form version retrieved successfully.",
      data
    });
  };

export const listServiceFormsController: RequestHandler =
  async (_request, response) => {
    const { serviceId } = getValidatedParams<{
      serviceId: string;
    }>(response);

    const data = await listServiceForms({
      serviceId
    });

    response.status(200).json({
      success: true,
      message: "Service form versions retrieved successfully.",
      data
    });
  };

export const createServiceFormController: RequestHandler =
  async (request, response) => {
    const { serviceId } = getValidatedParams<{
      serviceId: string;
    }>(response);

    const input = getValidatedBody<CreateServiceFormInput>(
      response
    );

    const data = await createServiceForm({
      serviceId,
      input,
      adminId: getAdminId(response),
      auditMetadata: getAuditMetadata(request)
    });

    response.status(201).json({
      success: true,
      message: "Service form draft created successfully.",
      data
    });
  };

export const updateServiceFormController: RequestHandler =
  async (request, response) => {
    const { serviceId, formId } = getValidatedParams<{
      serviceId: string;
      formId: string;
    }>(response);

    const input = getValidatedBody<UpdateServiceFormInput>(
      response
    );

    const data = await updateServiceForm({
      serviceId,
      formId,
      input,
      adminId: getAdminId(response),
      auditMetadata: getAuditMetadata(request)
    });

    response.status(200).json({
      success: true,
      message: "Service form draft updated successfully.",
      data
    });
  };

export const publishServiceFormController: RequestHandler =
  async (request, response) => {
    const { serviceId, formId } = getValidatedParams<{
      serviceId: string;
      formId: string;
    }>(response);

    const data = await publishServiceForm({
      serviceId,
      formId,
      adminId: getAdminId(response),
      auditMetadata: getAuditMetadata(request)
    });

    response.status(200).json({
      success: true,
      message: "Service form published successfully.",
      data
    });
  };
