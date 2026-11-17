import { Router } from "express";

import authenticate from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

import {
  getDashboardOverviewController
} from "./dashboard.controller.js";

const dashboardRouter = Router();

dashboardRouter.get(
  "/overview",
  authenticate,
  authorize("SUPER_ADMIN"),
  getDashboardOverviewController
);

export default dashboardRouter;
