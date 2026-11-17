import { Router } from "express";

import authenticate from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createServiceController,
  deleteServiceController,
  getPublicServiceFormHandler,
  getPublicServiceHandler,
  getPublicServicesHandler,
  getServiceController,
  listServicesController,
  updateServiceController,
  updateServiceStatusController
} from "./service.controller.js";

import {
  createServiceSchema,
  deleteServiceSchema,
  getServiceSchema,
  listServicesSchema,
  updateServiceSchema,
  updateServiceStatusSchema
} from "./service.validation.js";

import {
  createServiceFormController,
  getServiceFormController,
  getServiceFormVersionController,
  listServiceFormsController,
  publishServiceFormController,
  updateServiceFormController
} from "../services/serviceForm.controller.js";

import {
  createServiceFormSchema,
  getServiceFormSchema,
  getServiceFormVersionSchema,
  listServiceFormsSchema,
  publishServiceFormSchema,
  updateServiceFormSchema
} from "../services/serviceForm.validation.js";

const serviceRouter = Router();

// Public routes

serviceRouter.get("/", getPublicServicesHandler);

serviceRouter.get(
  "/:serviceId/form",
  validateRequest(getServiceSchema),
  getPublicServiceFormHandler
);

serviceRouter.get(
  "/:serviceId",
  validateRequest(getServiceSchema),
  getPublicServiceHandler
);

// Admin routes

const adminServiceRouter = Router();

adminServiceRouter.use(
  authenticate,
  authorize("SUPER_ADMIN")
);

adminServiceRouter.get(
  "/",
  validateRequest(listServicesSchema),
  listServicesController
);

adminServiceRouter.post(
  "/",
  validateRequest(createServiceSchema),
  createServiceController
);

// Service form routes

adminServiceRouter.get(
  "/:serviceId/form",
  validateRequest(getServiceFormSchema),
  getServiceFormController
);

adminServiceRouter.get(
  "/:serviceId/forms",
  validateRequest(listServiceFormsSchema),
  listServiceFormsController
);

adminServiceRouter.post(
  "/:serviceId/forms",
  validateRequest(createServiceFormSchema),
  createServiceFormController
);

adminServiceRouter.get(
  "/:serviceId/forms/:formId",
  validateRequest(getServiceFormVersionSchema),
  getServiceFormVersionController
);

adminServiceRouter.patch(
  "/:serviceId/forms/:formId",
  validateRequest(updateServiceFormSchema),
  updateServiceFormController
);

adminServiceRouter.post(
  "/:serviceId/forms/:formId/publish",
  validateRequest(publishServiceFormSchema),
  publishServiceFormController
);

// Individual service routes

adminServiceRouter.get(
  "/:serviceId",
  validateRequest(getServiceSchema),
  getServiceController
);

adminServiceRouter.patch(
  "/:serviceId",
  validateRequest(updateServiceSchema),
  updateServiceController
);

adminServiceRouter.patch(
  "/:serviceId/status",
  validateRequest(updateServiceStatusSchema),
  updateServiceStatusController
);

adminServiceRouter.delete(
  "/:serviceId",
  validateRequest(deleteServiceSchema),
  deleteServiceController
);

export {
  adminServiceRouter
};

export default serviceRouter;
