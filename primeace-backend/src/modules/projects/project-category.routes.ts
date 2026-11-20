import { Router } from "express";

import authenticate from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createProjectCategoryController,
  deleteProjectCategoryController,
  getProjectCategoryController,
  listProjectCategoriesController,
  updateProjectCategoryController,
  updateProjectCategoryStatusController
} from "./project-category.controller.js";

import {
  createProjectCategorySchema,
  deleteProjectCategorySchema,
  getProjectCategorySchema,
  listProjectCategoriesSchema,
  updateProjectCategorySchema,
  updateProjectCategoryStatusSchema
} from "./project-category.validation.js";

const projectCategoryRouter = Router();

projectCategoryRouter.use(
  authenticate,
  authorize("SUPER_ADMIN")
);

projectCategoryRouter.get(
  "/",
  validateRequest(listProjectCategoriesSchema),
  listProjectCategoriesController
);

projectCategoryRouter.post(
  "/",
  validateRequest(createProjectCategorySchema),
  createProjectCategoryController
);

projectCategoryRouter.get(
  "/:categoryId",
  validateRequest(getProjectCategorySchema),
  getProjectCategoryController
);

projectCategoryRouter.patch(
  "/:categoryId",
  validateRequest(updateProjectCategorySchema),
  updateProjectCategoryController
);

projectCategoryRouter.patch(
  "/:categoryId/status",
  validateRequest(updateProjectCategoryStatusSchema),
  updateProjectCategoryStatusController
);

projectCategoryRouter.delete(
  "/:categoryId",
  validateRequest(deleteProjectCategorySchema),
  deleteProjectCategoryController
);

export default projectCategoryRouter;
