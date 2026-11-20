
import { Router } from "express";

import {
  getPublicProjectCategoriesController
} from "./project-category.controller.js";

const publicProjectCategoryRouter = Router();

publicProjectCategoryRouter.get(
  "/",
  getPublicProjectCategoriesController
);

export default publicProjectCategoryRouter;