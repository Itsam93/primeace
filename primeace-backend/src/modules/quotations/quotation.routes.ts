import { Router, type RequestHandler } from "express";

import authenticate from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createQuotationController,
  createQuotationRevisionController,
  getPublicQuotationController,
  getQuotationController,
  listQuotationsController,
  issueQuotationController,
  respondToQuotationController,
  updateQuotationController,
  withdrawQuotationController
} from "./quotation.controller.js";

import {
  createQuotationSchema,
  getPublicQuotationSchema,
  listQuotationsSchema,
  quotationActionSchema,
  quotationClientResponseSchema,
  updateQuotationSchema
} from "./quotation.validation.js";

const quotationRouter = Router();

const adminAccess: RequestHandler[] = [
  authenticate,
  authorize("SUPER_ADMIN")
];

// Public client endpoints.
// Access is controlled by the secure quotation token.

quotationRouter.get(
  "/public/:token",
  validateRequest(getPublicQuotationSchema),
  getPublicQuotationController
);

quotationRouter.post(
  "/public/:token/respond",
  validateRequest(quotationClientResponseSchema),
  respondToQuotationController
);

// Administrative listing and detail endpoints.

quotationRouter.get(
  "/",
  ...adminAccess,
  validateRequest(listQuotationsSchema),
  listQuotationsController
);

quotationRouter.get(
  "/:quotationId",
  ...adminAccess,
  validateRequest(quotationActionSchema),
  getQuotationController
);

// Administrative quotation management endpoints.

quotationRouter.post(
  "/",
  ...adminAccess,
  validateRequest(createQuotationSchema),
  createQuotationController
);

quotationRouter.patch(
  "/:quotationId",
  ...adminAccess,
  validateRequest(updateQuotationSchema),
  updateQuotationController
);

quotationRouter.post(
  "/:quotationId/issue",
  ...adminAccess,
  validateRequest(quotationActionSchema),
  issueQuotationController
);

quotationRouter.post(
  "/:quotationId/withdraw",
  ...adminAccess,
  validateRequest(quotationActionSchema),
  withdrawQuotationController
);

quotationRouter.post(
  "/:quotationId/revisions",
  ...adminAccess,
  validateRequest(quotationActionSchema),
  createQuotationRevisionController
);

export default quotationRouter;
