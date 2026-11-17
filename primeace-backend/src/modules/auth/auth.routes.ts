import { Router } from "express";

import authenticate from "../../middleware/authenticate.js";
import { loginRateLimiter } from "../../middleware/loginRateLimiter.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import verifyCsrfToken from "../../middleware/verifyCsrfToken.js";

import {
  getCurrentAdmin,
  login,
  logout
} from "./auth.controller.js";

import { loginSchema } from "./auth.validation.js";

const authRouter = Router();

authRouter.post(
  "/login",
  loginRateLimiter,
  validateRequest(loginSchema),
  login
);

authRouter.post(
  "/logout",
  authenticate,
  verifyCsrfToken,
  logout
);

authRouter.get(
  "/me",
  authenticate,
  getCurrentAdmin
);

export default authRouter;
