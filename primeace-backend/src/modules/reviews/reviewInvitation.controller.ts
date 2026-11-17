import type {
  NextFunction,
  Request,
  Response
} from "express";

import { ApiError } from "../../shared/errors/ApiError.js";

import {
  createReviewInvitation,
  getPublicReviewInvitation,
  getReviewInvitationById,
  getReviewInvitations,
  renewReviewInvitation,
  revokeReviewInvitation,
  submitClientReview
} from "./reviewInvitation.service.js";

import {
  queueAndSendReviewInvitationEmail,
  sendQueuedReviewInvitationEmail
} from "./reviewEmailOutbox.service.js";

import type {
  CreateReviewInvitationInput,
  ListReviewInvitationsQuery,
  SubmitClientReviewInput
} from "./reviewInvitation.validation.js";

interface AuditContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface ValidatedRequest {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
}

function getValidatedRequest(
  response: Response
): ValidatedRequest {
  const validated = response.locals.validated as
    | ValidatedRequest
    | undefined;

  if (!validated) {
    throw new ApiError(
      500,
      "Validated request data is unavailable."
    );
  }

  return validated;
}

function getAdminId(response: Response): string {
  const admin = response.locals.admin as
    | { _id?: { toString(): string } }
    | undefined;

  if (!admin?._id) {
    throw new ApiError(
      401,
      "Authentication is required."
    );
  }

  return admin._id.toString();
}

function getAuditContext(
  request: Request
): AuditContext {
  return {
    ipAddress: request.ip ?? null,
    userAgent: request.get("user-agent") ?? null
  };
}

function getSafeInvitationData(
  invitation: {
    toObject: () => Record<string, unknown>;
  }
): Record<string, unknown> {
  const data = invitation.toObject();

  Reflect.deleteProperty(data, "tokenHash");

  return data;
}

function getDeliveryMessage(
  action: "created" | "renewed",
  sent: boolean
): string {
  if (sent) {
    return action === "created"
      ? "Review invitation created and email sent successfully."
      : "Review invitation renewed and email sent successfully.";
  }

  return action === "created"
    ? "Review invitation created, but the email could not be sent. You can retry delivery."
    : "Review invitation renewed, but the email could not be sent. You can retry delivery.";
}

export async function createReviewInvitationController(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = getValidatedRequest(response);

    const input = validated.body as CreateReviewInvitationInput;

    const result = await createReviewInvitation(
      input.projectId,
      getAdminId(response),
      getAuditContext(request)
    );

    const delivery = await queueAndSendReviewInvitationEmail({
      invitationId: result.invitation._id,
      token: result.token
    });

    response.status(201).json({
      success: true,
      message: getDeliveryMessage("created", delivery.sent),
      data: {
        invitation: getSafeInvitationData(result.invitation),
        email: {
          sent: delivery.sent,
          sentAt: delivery.sentAt,
          message: delivery.message
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function listReviewInvitationsController(
  _request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = getValidatedRequest(response);

    const query = validated.query as ListReviewInvitationsQuery;

    const result = await getReviewInvitations({
      page: query.page,
      limit: query.limit,
      ...(query.search !== undefined
        ? { search: query.search }
        : {}),
      ...(query.status !== undefined
        ? { status: query.status }
        : {})
    });

    response.status(200).json({
      success: true,
      message: "Review invitations retrieved successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getReviewInvitationController(
  _request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = getValidatedRequest(response);
    const invitationId = validated.params?.invitationId;

    if (!invitationId) {
      throw new ApiError(
        500,
        "Validated invitation ID is unavailable."
      );
    }

    const invitation = await getReviewInvitationById(
      invitationId
    );

    response.status(200).json({
      success: true,
      message: "Review invitation retrieved successfully.",
      data: invitation
    });
  } catch (error) {
    next(error);
  }
}

export async function renewReviewInvitationController(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = getValidatedRequest(response);
    const invitationId = validated.params?.invitationId;

    if (!invitationId) {
      throw new ApiError(
        500,
        "Validated invitation ID is unavailable."
      );
    }

    const result = await renewReviewInvitation(
      invitationId,
      getAdminId(response),
      getAuditContext(request)
    );

    const delivery = await queueAndSendReviewInvitationEmail({
      invitationId: result.invitation._id,
      token: result.token
    });

    response.status(200).json({
      success: true,
      message: getDeliveryMessage("renewed", delivery.sent),
      data: {
        invitation: getSafeInvitationData(result.invitation),
        email: {
          sent: delivery.sent,
          sentAt: delivery.sentAt,
          message: delivery.message
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function resendReviewInvitationController(
  _request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = getValidatedRequest(response);
    const invitationId = validated.params?.invitationId;

    if (!invitationId) {
      throw new ApiError(
        500,
        "Validated invitation ID is unavailable."
      );
    }

    const delivery = await sendQueuedReviewInvitationEmail(
      invitationId
    );

    response.status(200).json({
      success: true,
      message: delivery.message,
      data: {
        email: {
          sent: delivery.sent,
          sentAt: delivery.sentAt,
          message: delivery.message
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeReviewInvitationController(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = getValidatedRequest(response);
    const invitationId = validated.params?.invitationId;

    if (!invitationId) {
      throw new ApiError(
        500,
        "Validated invitation ID is unavailable."
      );
    }

    const invitation = await revokeReviewInvitation(
      invitationId,
      getAdminId(response),
      getAuditContext(request)
    );

    response.status(200).json({
      success: true,
      message: "Review invitation revoked successfully.",
      data: invitation
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicReviewInvitationController(
  _request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = getValidatedRequest(response);
    const token = validated.params?.token;

    if (!token) {
      throw new ApiError(
        500,
        "Validated invitation token is unavailable."
      );
    }

    const invitation = await getPublicReviewInvitation(
      token
    );

    response.status(200).json({
      success: true,
      message: "Review invitation retrieved successfully.",
      data: invitation
    });
  } catch (error) {
    next(error);
  }
}

export async function submitClientReviewController(
  _request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validated = getValidatedRequest(response);

    const token = validated.params?.token;

    if (!token) {
      throw new ApiError(
        500,
        "Validated invitation token is unavailable."
      );
    }

    const input = validated.body as SubmitClientReviewInput;

    const result = await submitClientReview({
      token,
      ...input
    });

    response.status(201).json({
      success: true,
      message: "Your review has been submitted successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
}
