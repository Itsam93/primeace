import type { RequestHandler, Response } from "express";

import type { CreatePublicServiceRequestInput } from "./public-service-request.validation.js";
import { createPublicServiceRequest } from "./public-service-request.service.js";

function getValidatedData<T>(response: Response): T {
  return response.locals.validated as T;
}

export const createPublicServiceRequestHandler: RequestHandler = async (
  _request,
  response
) => {
  const validated =
    getValidatedData<{ body: CreatePublicServiceRequestInput }>(response);

  const data = await createPublicServiceRequest(validated.body);

  response.status(201).json({
    success: true,
    message: "Your service request has been submitted successfully.",
    data: {
      reference: data.reference,
      submittedAt: data.submittedAt.toISOString(),
      supportingDocumentsEmail: "admin@primeace.com"
    }
  });
};
