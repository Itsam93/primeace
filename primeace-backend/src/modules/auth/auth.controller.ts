import type { RequestHandler } from "express";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_CSRF_COOKIE,
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
