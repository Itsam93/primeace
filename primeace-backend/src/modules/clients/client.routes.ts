import { Router } from "express";

import authenticate from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createClientController,
  getClientController,
  listClientsController
} from "./client.controller.js";

import {
  createClientSchema,
  getClientSchema,
  listClientsSchema
} from "./client.validation.js";

const clientRouter = Router();

clientRouter.use(
  authenticate,
  authorize("SUPER_ADMIN")
);

clientRouter.post(
  "/",
  validateRequest(createClientSchema),
  createClientController
);

clientRouter.get(
  "/",
  validateRequest(listClientsSchema),
  listClientsController
);

clientRouter.get(
  "/:clientId",
  validateRequest(getClientSchema),
  getClientController
);

export default clientRouter;
