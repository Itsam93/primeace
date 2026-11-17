
import { rateLimit } from "express-rate-limit";

export const publicRequestRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (_request, response) => {
    response.status(429).json({
      success: false,
      message: "Too many service request submissions. Please try again later."
    });
  }
});