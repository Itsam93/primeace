import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";

import type { ApiFailure, ApiErrorDetail } from "@primeace/shared";

import { env } from "../config/env.js";
import { ApiError } from "../shared/errors/ApiError.js";

function hasErrorCode(error: unknown, code: number): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function hasErrorType(error: unknown, type: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === type
  );
}

const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  next
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  let statusCode = 500;
  let message = "An unexpected error occurred.";
  let errors: ApiErrorDetail[] = [];

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.errors;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Request validation failed.";

    errors = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code
    }));
  } else if (hasErrorType(error, "entity.parse.failed")) {
    statusCode = 400;
    message = "Request body contains invalid JSON.";
  } else if (hasErrorType(error, "entity.too.large")) {
    statusCode = 413;
    message = "Request body exceeds the permitted size.";
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Database validation failed.";

    errors = Object.values(error.errors).map((issue) => ({
      field: issue.path,
      message: issue.message,
      code: "database_validation"
    }));
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid resource reference.";

    errors = [{
      field: error.path,
      message: "The supplied value is invalid.",
      code: "invalid_reference"
    }];
  } else if (hasErrorCode(error, 11000)) {
    statusCode = 409;
    message = "A record with the supplied information already exists.";
  }

  if (statusCode >= 500) {
    console.error("Application error:", error);

    if (env.NODE_ENV !== "development") {
      message = "An unexpected server error occurred.";
    } else if (error instanceof Error) {
      message = error.message;
    }
  }

  const responseBody: ApiFailure = errors.length > 0
    ? {
        success: false,
        message,
        errors
      }
    : {
        success: false,
        message
      };

  response.status(statusCode).json(responseBody);
};

export default errorHandler;
