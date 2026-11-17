import { Router } from "express";

import { validateRequest } from "../../middleware/validateRequest.js";
import { publicRequestRateLimiter } from "../../middleware/publicRequestRateLimiter.js";

import { createPublicServiceRequestHandler } from "./public-service-request.controller.js";
import { createPublicServiceRequestSchema } from "./public-service-request.validation.js";

const publicServiceRequestRouter = Router();

publicServiceRequestRouter.post(
  "/",
  publicRequestRateLimiter,
  validateRequest(createPublicServiceRequestSchema),
  createPublicServiceRequestHandler
);

export default publicServiceRequestRouter;