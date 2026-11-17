
import { Router } from "express";

import authenticate from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createServiceRequestNoteController,
  getServiceRequestController,
  listServiceRequestNotesController,
  listServiceRequestsController,
  updateServiceRequestStatusController
} from "./service-request.controller.js";

import {
  createServiceRequestNoteSchema,
  getServiceRequestSchema,
  listServiceRequestNotesSchema,
  listServiceRequestsSchema,
  updateServiceRequestStatusSchema
} from "./service-request.validation.js";

const serviceRequestRouter = Router();

serviceRequestRouter.use(
  authenticate,
  authorize("SUPER_ADMIN")
);

serviceRequestRouter.get(
  "/",
  validateRequest(listServiceRequestsSchema),
  listServiceRequestsController
);

serviceRequestRouter.get(
  "/:requestId",
  validateRequest(getServiceRequestSchema),
  getServiceRequestController
);

serviceRequestRouter.patch(
  "/:requestId/status",
  validateRequest(updateServiceRequestStatusSchema),
  updateServiceRequestStatusController
);

serviceRequestRouter.get(
  "/:requestId/notes",
  validateRequest(listServiceRequestNotesSchema),
  listServiceRequestNotesController
);

serviceRequestRouter.post(
  "/:requestId/notes",
  validateRequest(createServiceRequestNoteSchema),
  createServiceRequestNoteController
);

export default serviceRequestRouter;
