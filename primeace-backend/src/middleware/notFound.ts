import type { RequestHandler } from "express";

import { ApiError } from "../shared/errors/ApiError.js";

const notFound: RequestHandler = (request, _response, next) => {
  next(
    new ApiError(
      404,
      `Route ${request.method} ${request.originalUrl} was not found.`
    )
  );
};

export default notFound;
