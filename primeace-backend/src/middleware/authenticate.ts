import type { RequestHandler } from "express";

import { Admin } from "../modules/auth/Admin.js";
import { AdminSession } from "../modules/auth/adminSession.js";

import {
  ADMIN_SESSION_COOKIE,
  hashSessionToken
} from "../utils/session.utils.js";

import { ApiError } from "../shared/errors/ApiError.js";

const authenticate: RequestHandler = async (
  request,
  response,
  next
) => {
  const token = request.cookies?.[ADMIN_SESSION_COOKIE];

  if (typeof token !== "string" || !token) {
    throw new ApiError(401, "Authentication is required.");
  }

  const now = new Date();

  const session = await AdminSession.findOne({
    tokenHash: hashSessionToken(token),
    revokedAt: null,
    expiresAt: { $gt: now }
  }).select("+csrfTokenHash");

  if (!session) {
    throw new ApiError(401, "Your session is invalid or has expired.");
  }

  const admin = await Admin.findOne({
    _id: session.adminId,
    isActive: true,
    isDeleted: false
  });

  if (!admin) {
    await AdminSession.updateOne(
      {
        _id: session._id,
        revokedAt: null
      },
      {
        $set: {
          revokedAt: now
        }
      }
    );

    throw new ApiError(401, "Your administrator account is unavailable.");
  }

  await AdminSession.updateOne(
    {
      _id: session._id,
      revokedAt: null
    },
    {
      $set: {
        lastUsedAt: now
      }
    }
  );

  response.locals.admin = admin;
  response.locals.adminSession = session;

  next();
};

export default authenticate;
