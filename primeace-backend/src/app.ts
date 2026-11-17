import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import verifyRequestOrigin from "./middleware/verifyRequestOrigin.js";

const app = express();

const frontendOrigin = new URL(env.FRONTEND_URL).origin;

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token"
    ]
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(cookieParser());

// Validate origins before processing state-changing requests.
app.use(verifyRequestOrigin);

app.use("/api", apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
