import type { RequestHandler } from "express";

import { ApiError } from "../../shared/errors/ApiError.js";

import {
  createContractDraft,
  getContractById,
  getContracts,
  updateContractDraft,
  issueContract,
  withdrawContract,
  createContractRevision,
  getContractByAccessToken,
  respondToContract
} from "./contract.service.js";

import type {
  CreateContractInput,
  UpdateContractInput,
  ListContractsQuery,
  ContractClientResponseInput
} from "./contract.validation.js";

interface ValidatedRequestData {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
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

function getAdminId(
  response: Parameters<RequestHandler>[1]
): string {
  const admin = response.locals.admin as
    | { _id?: { toString(): string } }
    | undefined;

  if (!admin?._id) {
    throw new ApiError(
      401,
      "Administrator authentication is required."
    );
  }

  return admin._id.toString();
}

function getAuditContext(
  request: Parameters<RequestHandler>[0]
) {
  return {
    ipAddress: request.ip ?? null,
    userAgent: request.get("user-agent") ?? null
  };
}

/**
 * Create a contract draft from an approved quotation.
 */
export const createContract: RequestHandler = async (
  request,
  response
) => {
  const { body } = getValidatedData(response);

  const input = body as unknown as CreateContractInput;

  const { quotationId, ...contractDetails } = input;

  const contract = await createContractDraft(
    quotationId,
    contractDetails,
    getAdminId(response),
    getAuditContext(request)
  );

  response.status(201).json({
    success: true,
    message: "Contract draft created successfully.",
    data: contract
  });
};

/**
 * Retrieve contracts using pagination, filters and sorting.
 */
export const getContractsHandler: RequestHandler = async (
  _request,
  response
) => {
  const { query } = getValidatedData(response);

  const result = await getContracts(
    query as unknown as ListContractsQuery
  );

  response.status(200).json({
    success: true,
    message: "Contracts retrieved successfully.",
    data: result
  });
};

/**
 * Retrieve a contract by its database ID.
 */
export const getContract: RequestHandler = async (
  _request,
  response
) => {
  const { params } = getValidatedData(response);

  const contract = await getContractById(
    params!.contractId!
  );

  response.status(200).json({
    success: true,
    message: "Contract retrieved successfully.",
    data: contract
  });
};

/**
 * Update an existing contract draft.
 */
export const updateContract: RequestHandler = async (
  request,
  response
) => {
  const { params, body } = getValidatedData(response);

  const contract = await updateContractDraft(
    params!.contractId!,
    body as unknown as UpdateContractInput,
    getAdminId(response),
    getAuditContext(request)
  );

  response.status(200).json({
    success: true,
    message: "Contract draft updated successfully.",
    data: contract
  });
};

/**
 * Issue a contract to the client.
 */
export const issueContractHandler: RequestHandler = async (
  request,
  response
) => {
  const { params } = getValidatedData(response);

  const result = await issueContract(
    params!.contractId!,
    getAdminId(response),
    getAuditContext(request)
  );

  response.status(200).json({
    success: true,
    message: "Contract issued successfully.",
    data: result
  });
};

/**
 * Withdraw an issued contract.
 */
export const withdrawContractHandler: RequestHandler = async (
  request,
  response
) => {
  const { params } = getValidatedData(response);

  const contract = await withdrawContract(
    params!.contractId!,
    getAdminId(response),
    getAuditContext(request)
  );

  response.status(200).json({
    success: true,
    message: "Contract withdrawn successfully.",
    data: contract
  });
};

/**
 * Create a new draft revision.
 */
export const createContractRevisionHandler: RequestHandler = async (
  request,
  response
) => {
  const { params } = getValidatedData(response);

  const contract = await createContractRevision(
    params!.contractId!,
    getAdminId(response),
    getAuditContext(request)
  );

  response.status(201).json({
    success: true,
    message: "Contract revision created successfully.",
    data: contract
  });
};

/**
 * Retrieve a contract through its secure client access token.
 */
export const getPublicContract: RequestHandler = async (
  _request,
  response
) => {
  const { params } = getValidatedData(response);

  const contract = await getContractByAccessToken(
    params!.token!
  );

  response.status(200).json({
    success: true,
    message: "Contract retrieved successfully.",
    data: contract
  });
};

/**
 * Record a client's acceptance or rejection.
 */
export const respondToContractHandler: RequestHandler = async (
  request,
  response
) => {
  const { params, body } = getValidatedData(response);

  const input = body as unknown as ContractClientResponseInput;

  const contract = await respondToContract(
    params!.token!,
    input,
    getAuditContext(request)
  );

  response.status(200).json({
    success: true,
    message:
      input.response === "accepted"
        ? "Contract accepted successfully."
        : "Contract rejected successfully.",
    data: contract
  });
};