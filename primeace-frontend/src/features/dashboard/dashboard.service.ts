import { apiRequest } from "../../lib/api.js";

import type {
  IDashboardOverview
} from "./dashboard.type.js";

export async function getDashboardOverview(): Promise<IDashboardOverview> {
  return apiRequest<IDashboardOverview>("/dashboard/overview");
}
