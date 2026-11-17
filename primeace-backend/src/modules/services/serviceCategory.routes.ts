import { Router } from "express";

import authenticate from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createServiceCategoryController,
  deleteServiceCategoryController,
  getServiceCategoryController,
  listServiceCategoriesController,
  updateServiceCategoryController,
  updateServiceCategoryStatusController
} from "./serviceCategory.controller.js";

import {
  createServiceCategorySchema,
  deleteServiceCategorySchema,
  getServiceCategorySchema,
  listServiceCategoriesSchema,
  updateServiceCategorySchema,
  updateServiceCategoryStatusSchema
} from "./serviceCategory.validation.js";

const serviceCategoryRouter = Router();

serviceCategoryRouter.use(
  authenticate,
  authorize("SUPER_ADMIN")
);

serviceCategoryRouter.get(
  "/",
  validateRequest(listServiceCategoriesSchema),
  listServiceCategoriesController
);

serviceCategoryRouter.post(
  "/",
  validateRequest(createServiceCategorySchema),
  createServiceCategoryController
);

serviceCategoryRouter.get(
  "/:categoryId",
  validateRequest(getServiceCategorySchema),
  getServiceCategoryController
);

serviceCategoryRouter.patch(
  "/:categoryId",
  validateRequest(updateServiceCategorySchema),
  updateServiceCategoryController
);

serviceCategoryRouter.patch(
  "/:categoryId/status",
  validateRequest(updateServiceCategoryStatusSchema),
  updateServiceCategoryStatusController
);

serviceCategoryRouter.delete(
  "/:categoryId",
  validateRequest(deleteServiceCategorySchema),
  deleteServiceCategoryController
);

export default serviceCategoryRouter;
