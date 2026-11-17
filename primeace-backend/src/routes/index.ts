import { Router } from "express";
import mongoose from "mongoose";

import authRouter from "../modules/auth/auth.routes.js";
import dashboardRouter from "../modules/dashboard/dashboard.routes.js";
import quotationRouter from "../modules/quotations/quotation.routes.js";
import serviceRouter, {
  adminServiceRouter
} from "../modules/services/service.routes.js";
import serviceCategoryRouter from "../modules/services/serviceCategory.routes.js";
import publicServiceRequestRouter from "../modules/service-requests/public-service-request.routes.js";
import serviceRequestRouter from "../modules/service-requests/service-request.routes.js";
import contractRouter from "../modules/contracts/contract.routes.js";
import projectRouter from "../modules/projects/project.routes.js";
import reviewRouter from "../modules/reviews/review.routes.js";
import reviewInvitationRouter from "../modules/reviews/reviewInvitation.routes.js";
import clientRouter from "../modules/clients/client.routes.js";

const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  response.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: databaseConnected
      ? "PrimeAce API is running."
      : "PrimeAce API database connection is unavailable.",
    data: {
      status: databaseConnected ? "healthy" : "unavailable",
      database: databaseConnected ? "connected" : "disconnected"
    }
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);

apiRouter.use("/service-categories", serviceCategoryRouter);
apiRouter.use("/admin/services", adminServiceRouter);
apiRouter.use("/services", serviceRouter);

apiRouter.use(
  "/service-requests/public",
  publicServiceRequestRouter
);

apiRouter.use("/service-requests", serviceRequestRouter);

apiRouter.use("/quotations", quotationRouter);
apiRouter.use("/contracts", contractRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/reviews", reviewRouter);
apiRouter.use("/review-invitations", reviewInvitationRouter);
apiRouter.use("/clients", clientRouter);

export default apiRouter;
