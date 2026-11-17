import type { RequestHandler } from "express";

import { env } from "../config/env.js";
import { ApiError } from "../shared/errors/ApiError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const allowedOrigin = new URL(env.FRONTEND_URL).origin;

const verifyRequestOrigin: RequestHandler = (
  request,
  _response,
  next
) => {
  if (SAFE_METHODS.has(request.method)) {
    next();
    return;
  }

  const requestOrigin = request.get("origin");

  // Permit requests without an Origin header in development
  // to support local CLI tools and API testing.
  if (!requestOrigin && env.NODE_ENV !== "production") {
    next();
    return;
  }

  let normalizedRequestOrigin: string;

  try {
    normalizedRequestOrigin = new URL(requestOrigin ?? "").origin;
  } catch {
    throw new ApiError(403, "Request origin is not permitted.");
  }

  if (normalizedRequestOrigin !== allowedOrigin) {
    throw new ApiError(403, "Request origin is not permitted.");
  }

  next();
};

export default verifyRequestOrigin;
