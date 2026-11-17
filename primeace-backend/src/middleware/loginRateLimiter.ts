import { rateLimit } from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_request, response) => {
    response.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again later."
    });
  }
});