import { Router } from "express";

import authenticate from "../../middleware/authenticate.js";
import verifyCsrfToken from "../../middleware/verifyCsrfToken.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createReviewInvitationController,
  getPublicReviewInvitationController,
  getReviewInvitationController,
  listReviewInvitationsController,
  renewReviewInvitationController,
  resendReviewInvitationController,
  revokeReviewInvitationController,
  submitClientReviewController
} from "./reviewInvitation.controller.js";

import {
  createReviewInvitationSchema,
  listReviewInvitationsSchema,
  publicReviewInvitationTokenParamsSchema,
  reviewInvitationIdParamsSchema,
  submitClientReviewSchema
} from "./reviewInvitation.validation.js";

const router = Router();

/*
 * Public client routes
 */

router.get(
  "/public/:token",
  validateRequest(publicReviewInvitationTokenParamsSchema),
  getPublicReviewInvitationController
);

router.post(
  "/public/:token/submit",
  validateRequest(submitClientReviewSchema),
  submitClientReviewController
);

/*
 * Authenticated administrator routes
 */

router.use(authenticate);

// List review invitations.
router.get(
  "/",
  validateRequest(listReviewInvitationsSchema),
  listReviewInvitationsController
);

// Create and email an invitation.
router.post(
  "/",
  verifyCsrfToken,
  validateRequest(createReviewInvitationSchema),
  createReviewInvitationController
);

// Retrieve a specific invitation.
router.get(
  "/:invitationId",
  validateRequest(reviewInvitationIdParamsSchema),
  getReviewInvitationController
);

// Resend an existing invitation without rotating its token.
router.post(
  "/:invitationId/resend",
  verifyCsrfToken,
  validateRequest(reviewInvitationIdParamsSchema),
  resendReviewInvitationController
);

// Renew an invitation and send a replacement link.
router.post(
  "/:invitationId/renew",
  verifyCsrfToken,
  validateRequest(reviewInvitationIdParamsSchema),
  renewReviewInvitationController
);

// Revoke an invitation.
router.post(
  "/:invitationId/revoke",
  verifyCsrfToken,
  validateRequest(reviewInvitationIdParamsSchema),
  revokeReviewInvitationController
);

export default router;
