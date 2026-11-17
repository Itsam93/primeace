import { Router } from "express";

import authenticate from "../../middleware/authenticate.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createHistoricalProjectSchema,
  projectIdParamsSchema,
  listProjectsSchema,
  updateProjectStatusSchema
} from "./project.validation.js";

import {
  createHistoricalProjectHandler,
  getAllProjects,
  getProject,
  updateProjectStatusHandler
} from "./project.controller.js";

const projectRouter = Router();

projectRouter.use(authenticate);

// Create a historical project manually.
projectRouter.post(
  "/historical",
  validateRequest(createHistoricalProjectSchema),
  createHistoricalProjectHandler
);

// Retrieve all projects with pagination and filtering.
projectRouter.get(
  "/",
  validateRequest(listProjectsSchema),
  getAllProjects
);

// Update a project's status.
projectRouter.patch(
  "/:projectId/status",
  validateRequest(updateProjectStatusSchema),
  updateProjectStatusHandler
);

// Retrieve an individual project.
projectRouter.get(
  "/:projectId",
  validateRequest(projectIdParamsSchema),
  getProject
);

export default projectRouter;
