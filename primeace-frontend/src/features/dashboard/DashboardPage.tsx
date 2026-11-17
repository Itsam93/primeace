import { useCallback, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderKanban,
  MessageSquareText,
  RefreshCw,
  Star,
  Users,
  Clock
} from "lucide-react";

import { ApiError } from "../../lib/api.js";
import { useAuth } from "../auth/AuthContext.js";

import { getDashboardOverview } from "./dashboard.service.js";

import type { IDashboardOverview } from "./dashboard.type.js";

import DashboardStatCard from "./components/DashboardStatCard.js";
import DashboardLoading from "./components/DashboardLoading.js";
import DashboardError from "./components/DashboardError.js";
import RecentRequests from "./components/RecentRequests.js";
import RecentProjects from "./components/RecentProjects.js";
import RecentActivity from "./components/RecentActivity.js";

function DashboardPage() {
  const { admin } = useAuth();

  const [overview, setOverview] =
    useState<IDashboardOverview | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await getDashboardOverview();
      setOverview(data);
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred while loading the dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (isLoading && !overview) {
    return <DashboardLoading />;
  }

  if (error && !overview) {
    return (
      <DashboardError
        message={error}
        onRetry={() => void loadDashboard()}
      />
    );
  }

  if (!overview) {
    return null;
  }

  const { statistics } = overview;

  const formattedDate = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-9">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#1556D6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1556D6]" />
            Business overview
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#07152F] sm:text-[30px]">
            Welcome back, {admin?.fullName}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Here's what's happening across your PrimeAce operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-500">
            <CalendarDays size={16} className="text-slate-400" />
            <span>{formattedDate}</span>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={isLoading}
            className="
              inline-flex h-10 items-center justify-center gap-2
              rounded-lg bg-[#1556D6] px-4
              text-sm font-medium text-white
              transition-colors hover:bg-[#1048BA]
              disabled:cursor-not-allowed disabled:opacity-60
            "
          >
            <RefreshCw
              size={15}
              className={isLoading ? "animate-spin" : ""}
            />

            {isLoading ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </section>

      {/* Refresh error */}
      {error && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center"
        >
          <p className="text-sm leading-6 text-amber-800">
            Dashboard refresh failed. Showing the last successfully loaded data.
            {" "}
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="shrink-0 text-left text-sm font-semibold text-amber-900 underline-offset-4 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Business statistics */}
      <section>
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-base font-semibold text-[#07152F]">
              Business statistics
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              A summary of your clients, requests, and ongoing work.
            </p>
          </div>

          <p className="text-xs text-slate-400">
            All figures reflect current records
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            title="Total Clients"
            value={statistics.clients.total}
            icon={Users}
            accent="blue"
          />

          <DashboardStatCard
            title="Service Requests"
            value={statistics.requests.total}
            icon={ClipboardList}
            accent="violet"
          />

          <DashboardStatCard
            title="New Requests"
            value={statistics.requests.new}
            icon={MessageSquareText}
            accent="amber"
            description={`${statistics.requests.underReview.toLocaleString()} currently under review`}
          />

          <DashboardStatCard
            title="Quotations"
            value={statistics.quotations.totalDocuments}
            icon={FileText}
            accent="blue"
            description={`${statistics.quotations.awaitingResponse.toLocaleString()} awaiting response`}
          />

          <DashboardStatCard
            title="Contracts"
            value={statistics.contracts.totalDocuments}
            icon={BriefcaseBusiness}
            accent="violet"
            description={`${statistics.contracts.awaitingAcceptance.toLocaleString()} awaiting acceptance`}
          />

          <DashboardStatCard
            title="Active Projects"
            value={statistics.projects.active}
            icon={FolderKanban}
            accent="emerald"
            description={`${statistics.projects.completed.toLocaleString()} completed`}
          />

          <DashboardStatCard
            title="Pending Reviews"
            value={statistics.reviews.pending}
            icon={Star}
            accent="amber"
          />

          <DashboardStatCard
            title="Awaiting Information"
            value={statistics.requests.awaitingInformation}
            icon={Clock}
            accent="blue"
            description="Requests requiring additional information"
          />
        </div>
      </section>

      {/* Recent operational records */}
      <section>
        <div className="mb-5 border-b border-slate-200 pb-4">
          <h2 className="text-base font-semibold text-[#07152F]">
            Recent operations
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Keep track of recently submitted requests and project progress.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <RecentRequests
            requests={overview.recentRequests}
          />

          <RecentProjects
            projects={overview.recentProjects}
          />
        </div>
      </section>

      {/* Activity */}
      <section>
        <div className="mb-5 border-b border-slate-200 pb-4">
          <h2 className="text-base font-semibold text-[#07152F]">
            Activity log
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            A record of recent activity across your workspace.
          </p>
        </div>

        <RecentActivity
          activities={overview.recentActivity}
        />
      </section>
    </div>
  );
}

export default DashboardPage;
