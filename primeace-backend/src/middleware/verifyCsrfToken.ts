import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

import type { AdminSessionDocument } from "../modules/auth/adminSession.js";

import {
  ADMIN_CSRF_COOKIE,
  hashCsrfToken
} from "../utils/session.utils.js";

import { ApiError } from "../shared/errors/ApiError.js";

const verifyCsrfToken: RequestHandler = (
  request,
  response,
  next
) => {
  const cookieToken = request.cookies?.[ADMIN_CSRF_COOKIE];
  const headerToken = request.get("x-csrf-token");

  const session = response.locals.adminSession as
    | AdminSessionDocument
    | undefined;

  if (
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string" ||
    !session ||
    !session.csrfTokenHash
  ) {
    throw new ApiError(403, "CSRF validation failed.");
  }

  const cookieHash = hashCsrfToken(cookieToken);
  const headerHash = hashCsrfToken(headerToken);
  const storedHash = session.csrfTokenHash;

  const cookieBuffer = Buffer.from(cookieHash, "hex");
  const headerBuffer = Buffer.from(headerHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  const valid =
    cookieBuffer.length === storedBuffer.length &&
    headerBuffer.length === storedBuffer.length &&
    timingSafeEqual(cookieBuffer, headerBuffer) &&
    timingSafeEqual(headerBuffer, storedBuffer);

  if (!valid) {
    throw new ApiError(403, "CSRF validation failed.");
  }

  next();
};

export default verifyCsrfToken;
