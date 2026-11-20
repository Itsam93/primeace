import { Router } from "express";

import authenticate from "../../middleware/authenticate.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createHistoricalProjectSchema,
  projectIdParamsSchema,
  listProjectsSchema,
  updateProjectFeaturedSchema,
  updateProjectSchema,
  updateProjectStatusSchema
} from "./project.validation.js";

import {
  createHistoricalProjectHandler,
  getAllProjects,
  getFeaturedPublicProjectsHandler,
  getProject,
  updateProjectFeaturedHandler,
  updateProjectHandler,
  updateProjectStatusHandler
} from "./project.controller.js";

const projectRouter = Router();

// Public project showcase.
projectRouter.get(
  "/featured",
  getFeaturedPublicProjectsHandler
);

// All routes below this point require administrator authentication.
projectRouter.use(authenticate);

// Create a historical project.
projectRouter.post(
  "/historical",
  validateRequest(createHistoricalProjectSchema),
  createHistoricalProjectHandler
);

// Retrieve all projects.
projectRouter.get(
  "/",
  validateRequest(listProjectsSchema),
  getAllProjects
);

// Update project information.
projectRouter.patch(
  "/:projectId",
  validateRequest(updateProjectSchema),
  updateProjectHandler
);

// Update project status.
projectRouter.patch(
  "/:projectId/status",
  validateRequest(updateProjectStatusSchema),
  updateProjectStatusHandler
);

// Feature or unfeature a project.
projectRouter.patch(
  "/:projectId/featured",
  validateRequest(updateProjectFeaturedSchema),
  updateProjectFeaturedHandler
);

// Retrieve an individual project.
projectRouter.get(
  "/:projectId",
  validateRequest(projectIdParamsSchema),
  getProject
);

export default projectRouter;
