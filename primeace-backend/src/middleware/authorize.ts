import type { RequestHandler } from "express";

import {
  type AdminRole,
  type AdminDocument
} from "../modules/auth/Admin.js";

import { ApiError } from "../shared/errors/ApiError.js";

export function authorize(
  ...allowedRoles: AdminRole[]
): RequestHandler {
  return (_request, response, next) => {
    const admin = response.locals.admin as
      | AdminDocument
      | undefined;

    if (!admin) {
      throw new ApiError(401, "Authentication is required.");
    }

    if (!allowedRoles.includes(admin.role)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action."
      );
    }

    next();
  };
}
