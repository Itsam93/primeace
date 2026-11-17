import type { RequestHandler } from "express";

import { ApiError } from "../../shared/errors/ApiError.js";

import {
  createServiceRequestNote,
  getServiceRequestById,
  listServiceRequestNotes,
  listServiceRequests,
  updateServiceRequestStatus
} from "./service-request.service.js";

import type {
  CreateServiceRequestNoteInput,
  GetServiceRequestInput,
  ListServiceRequestNotesInput,
  ListServiceRequestsInput,
  UpdateServiceRequestStatusInput
} from "./service-request.validation.js";

interface AuthenticatedAdmin {
  _id: string;
}

function getAdminId(response: Parameters<RequestHandler>[1]): string {
  const admin = response.locals.admin as
    | AuthenticatedAdmin
    | undefined;

  if (!admin?._id) {
    throw new ApiError(401, "Administrator authentication is required.");
  }

  return admin._id;
}

function getAuditMetadata(
  request: Parameters<RequestHandler>[0]
) {
  return {
    ipAddress: request.ip ?? null,
    userAgent: request.get("user-agent") ?? null
  };
}

export const listServiceRequestsController: RequestHandler =
  async (_request, response) => {
    const validated = response.locals.validated as
      ListServiceRequestsInput;

    const result = await listServiceRequests(
      validated.query
    );

    response.status(200).json({
      success: true,
      message: "Service requests retrieved successfully.",
      data: result.requests,
      meta: result.pagination
    });
  };

export const getServiceRequestController: RequestHandler =
  async (_request, response) => {
    const validated = response.locals.validated as
      GetServiceRequestInput;

    const request = await getServiceRequestById(
      validated.params.requestId
    );

    response.status(200).json({
      success: true,
      message: "Service request retrieved successfully.",
      data: request
    });
  };

export const updateServiceRequestStatusController: RequestHandler =
  async (request, response) => {
    const validated = response.locals.validated as
      UpdateServiceRequestStatusInput;

    const result = await updateServiceRequestStatus({
      requestId: validated.params.requestId,
      status: validated.body.status,
      adminId: getAdminId(response),
      auditMetadata: getAuditMetadata(request)
    });

    response.status(200).json({
      success: true,
      message: "Service request status updated successfully.",
      data: result
    });
  };

export const createServiceRequestNoteController: RequestHandler =
  async (request, response) => {
    const validated = response.locals.validated as
      CreateServiceRequestNoteInput;

    const result = await createServiceRequestNote({
      requestId: validated.params.requestId,
      content: validated.body.content,
      adminId: getAdminId(response),
      auditMetadata: getAuditMetadata(request)
    });

    response.status(201).json({
      success: true,
      message: "Internal note added successfully.",
      data: result
    });
  };

export const listServiceRequestNotesController: RequestHandler =
  async (_request, response) => {
    const validated = response.locals.validated as
      ListServiceRequestNotesInput;

    const result = await listServiceRequestNotes({
      requestId: validated.params.requestId,
      page: validated.query.page,
      limit: validated.query.limit
    });

    response.status(200).json({
      success: true,
      message: "Internal notes retrieved successfully.",
      data: result.notes,
      meta: result.pagination
    });
  };
