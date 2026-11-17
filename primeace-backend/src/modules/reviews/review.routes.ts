import { Router } from "express";

import authenticate from "../../middleware/authenticate.js";
import verifyCsrfToken from "../../middleware/verifyCsrfToken.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createAdminReviewSchema,
  listReviewsSchema,
  reviewIdParamsSchema,
  moderateReviewSchema
} from "./review.validation.js";

import {
  getFeaturedReviewsHandler,
  getEligibleReviewProjectsHandler,
  createAdminReviewHandler,
  getReviewsHandler,
  getReviewHandler,
  moderateReviewHandler
} from "./review.controller.js";

const reviewRouter = Router();

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

reviewRouter.get(
  "/featured",
  getFeaturedReviewsHandler
);

/*
|--------------------------------------------------------------------------
| Administrator routes
|--------------------------------------------------------------------------
*/

reviewRouter.use(authenticate);

reviewRouter.get(
  "/eligible-projects",
  getEligibleReviewProjectsHandler
);

reviewRouter.post(
  "/admin",
  verifyCsrfToken,
  validateRequest(createAdminReviewSchema),
  createAdminReviewHandler
);

reviewRouter.get(
  "/",
  validateRequest(listReviewsSchema),
  getReviewsHandler
);

reviewRouter.get(
  "/:reviewId",
  validateRequest(reviewIdParamsSchema),
  getReviewHandler
);

reviewRouter.patch(
  "/:reviewId/moderation",
  verifyCsrfToken,
  validateRequest(moderateReviewSchema),
  moderateReviewHandler
);

export default reviewRouter;
