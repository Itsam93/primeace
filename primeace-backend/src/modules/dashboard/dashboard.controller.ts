import type { RequestHandler } from "express";

import { getDashboardOverview } from "./dashboard.service.js";

export const getDashboardOverviewController: RequestHandler =
  async (_request, response) => {
    const overview = await getDashboardOverview();

    response.status(200).json({
      success: true,
      message: "Dashboard overview retrieved successfully.",
      data: overview
    });
  };
