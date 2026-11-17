import type {
  Request,
  Response,
  NextFunction
} from "express";

import {
  createQuotationDraft,
  createQuotationRevision,
  getQuotationByAccessToken,
  getQuotationById,
  issueQuotation,
  listQuotations,
  respondToQuotation,
  updateQuotationDraft,
  withdrawQuotation
} from "./quotation.service.js";

import type {
  CreateQuotationInput,
  ListQuotationsQuery,
  UpdateQuotationInput,
  QuotationClientResponseInput
} from "./quotation.validation.js";

function getAdminId(response: Response): string {
  const admin = response.locals.admin as
    | { _id: { toString(): string } }
    | undefined;

  if (!admin?._id) {
    throw new Error(
      "Authenticated administrator information is unavailable."
    );
  }

  return admin._id.toString();
}

function getAuditContext(request: Request) {
  return {
    ipAddress: request.ip ?? null,
    userAgent: request.get("user-agent") ?? null
  };
}

/**
 * Create a quotation draft.
 */
export async function createQuotationController(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const validated = response.locals.validated as {
      body: CreateQuotationInput;
    };

    const quotation = await createQuotationDraft(
      validated.body,
      getAdminId(response),
      getAuditContext(request)
    );

    response.status(201).json({
      success: true,
      message: "Quotation draft created successfully.",
      data: quotation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List quotations with pagination and filters.
 */
export async function listQuotationsController(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const validated = response.locals.validated as {
      query: ListQuotationsQuery;
    };

    const result = await listQuotations(validated.query);

    response.status(200).json({
      success: true,
      message: "Quotations retrieved successfully.",
      data: result.quotations,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve an individual quotation.
 */
export async function getQuotationController(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const validated = response.locals.validated as {
      params: { quotationId: string };
    };

    const quotation = await getQuotationById(
      validated.params.quotationId
    );

    response.status(200).json({
      success: true,
      message: "Quotation retrieved successfully.",
      data: quotation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing quotation draft.
 */
export async function updateQuotationController(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const validated = response.locals.validated as {
      params: { quotationId: string };
      body: UpdateQuotationInput;
    };

    const quotation = await updateQuotationDraft(
      validated.params.quotationId,
      validated.body,
      getAdminId(response),
      getAuditContext(request)
    );

    response.status(200).json({
      success: true,
      message: "Quotation draft updated successfully.",
      data: quotation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Issue a quotation to the client.
 */
export async function issueQuotationController(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const validated = response.locals.validated as {
      params: { quotationId: string };
    };

    const result = await issueQuotation(
      validated.params.quotationId,
      getAdminId(response),
      getAuditContext(request)
    );

    response.status(200).json({
      success: true,
      message: "Quotation issued successfully.",
      data: {
        quotation: result.quotation,
        accessToken: result.accessToken
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Withdraw an issued quotation.
 */
export async function withdrawQuotationController(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const validated = response.locals.validated as {
      params: { quotationId: string };
    };

    const quotation = await withdrawQuotation(
      validated.params.quotationId,
      getAdminId(response),
      getAuditContext(request)
    );

    response.status(200).json({
      success: true,
      message: "Quotation withdrawn successfully.",
      data: quotation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new quotation revision.
 */
export async function createQuotationRevisionController(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const validated = response.locals.validated as {
      params: { quotationId: string };
    };

    const quotation = await createQuotationRevision(
      validated.params.quotationId,
      getAdminId(response),
      getAuditContext(request)
    );

    response.status(201).json({
      success: true,
      message: "Quotation revision created successfully.",
      data: quotation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a quotation using its secure client access token.
 */
export async function getPublicQuotationController(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const validated = response.locals.validated as {
      params: { token: string };
    };

    const quotation = await getQuotationByAccessToken(
      validated.params.token
    );

    response.status(200).json({
      success: true,
      message: "Quotation retrieved successfully.",
      data: quotation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record a client's response to an issued quotation.
 */
export async function respondToQuotationController(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const validated = response.locals.validated as {
      params: { token: string };
      body: QuotationClientResponseInput;
    };

    const quotation = await respondToQuotation(
      validated.params.token,
      validated.body,
      getAuditContext(request)
    );

    response.status(200).json({
      success: true,
      message: "Your quotation response has been recorded.",
      data: quotation
    });
  } catch (error) {
    next(error);
  }
}
