import type { RequestHandler } from "express";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_CSRF_COOKIE,
  generateCsrfToken,
  hashCsrfToken,
  getAdminSessionCookieOptions,
  getAdminCsrfCookieOptions,
  getExpiredCookieOptions,
  getExpiredCsrfCookieOptions
} from "../../utils/session.utils.js";

import {
  getAuthenticatedAdmin,
  loginAdmin,
  logoutAdmin
} from "./auth.service.js";

import { AdminSession } from "./adminSession.js";
import type { AdminSessionDocument } from "./adminSession.js";
import type { LoginInput } from "./auth.validation.js";

import { ApiError } from "../../shared/errors/ApiError.js";

interface AuthenticatedAdminRecord {
  _id: unknown;
  fullName: string;
  email: string;
  role: string;
}

export const login: RequestHandler = async (request, response) => {
  const validated = (
    response.locals.validated as { body: LoginInput }
  ).body;

  const result = await loginAdmin(validated, {
    ipAddress: request.ip ?? null,
    userAgent: request.get("user-agent") ?? null
  });

  response.cookie(
    ADMIN_SESSION_COOKIE,
    result.token,
    getAdminSessionCookieOptions()
  );

  response.cookie(
    ADMIN_CSRF_COOKIE,
    result.csrfToken,
    getAdminCsrfCookieOptions()
  );

  response.status(200).json({
    success: true,
    message: "Login successful.",
    data: {
      admin: result.admin,
      csrfToken: result.csrfToken,
      expiresAt: result.expiresAt
    }
  });
};


export const refreshCsrfToken: RequestHandler = async (
  _request,
  response
) => {
  const session = response.locals.adminSession as
    | AdminSessionDocument
    | undefined;

  if (!session) {
    throw new ApiError(401, "Authentication is required.");
  }

  const csrfToken = generateCsrfToken();

  const updateResult = await AdminSession.updateOne(
    {
      tokenHash: session.tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    },
    {
      $set: {
        csrfTokenHash: hashCsrfToken(csrfToken)
      }
    }
  );

  if (updateResult.matchedCount === 0) {
    throw new ApiError(401, "Your session is invalid or has expired.");
  }

  response.cookie(
    ADMIN_CSRF_COOKIE,
    csrfToken,
    getAdminCsrfCookieOptions()
  );

  response.status(200).json({
    success: true,
    message: "CSRF token refreshed successfully.",
    data: {
      csrfToken
    }
  });
};


export const logout: RequestHandler = async (request, response) => {
  const token = request.cookies?.[ADMIN_SESSION_COOKIE];

  if (typeof token === "string" && token.length > 0) {
    await logoutAdmin(token);
  }

  response.clearCookie(
    ADMIN_SESSION_COOKIE,
    getExpiredCookieOptions()
  );

  response.clearCookie(
    ADMIN_CSRF_COOKIE,
    getExpiredCsrfCookieOptions()
  );

  response.status(200).json({
    success: true,
    message: "Logout successful.",
    data: null
  });
};

export const getCurrentAdmin: RequestHandler = (
  _request,
  response
) => {
  const admin = response.locals.admin as
    | AuthenticatedAdminRecord
    | undefined;

  if (!admin) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.status(200).json({
    success: true,
    message: "Administrator profile retrieved successfully.",
    data: {
      admin: getAuthenticatedAdmin(admin)
    }
  });
};
