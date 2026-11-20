import { Router } from "express";

import {
  getFeaturedPublicProjectsHandler
} from "./project.controller.js";

const publicProjectRouter = Router();

publicProjectRouter.get(
  "/featured",
  getFeaturedPublicProjectsHandler
);

export default publicProjectRouter;
