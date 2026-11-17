import { ArrowUpRight, FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";

import DashboardSectionHeader from "./DashboardSectionHeader.js";

import type {
  IDashboardProject
} from "../dashboard.type.js";

interface IRecentProjectsProps {
  projects: IDashboardProject[];
}

const statusStyles: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  on_hold: "bg-orange-50 text-orange-700",
  completed: "bg-emerald-50 text-emerald-700"
};

function normalizeStatus(status: string): string {
  return status.toLowerCase();
}

function formatStatus(status: string): string {
  return normalizeStatus(status)
    .split("_")
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function formatDate(date: string | null): string {
  if (!date) {
    return "Not specified";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parsedDate);
}

function RecentProjects({
  projects
}: IRecentProjectsProps) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <DashboardSectionHeader
        title="Recent Projects"
        description="A quick overview of recently created projects."
        actionLabel="View all"
        actionHref="/admin/projects"
      />

      {projects.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
            <FolderKanban size={20} strokeWidth={1.8} />
          </div>

          <p className="mt-4 text-sm font-semibold text-[#07152F]">
            No projects available
          </p>

          <p className="mt-1 max-w-xs text-sm leading-5 text-slate-500">
            Projects will appear here when contracts are accepted.
          </p>
        </div>
      ) : (
        <div className="mt-5 divide-y divide-slate-100">
          {projects.map((project) => {
            const normalizedStatus = normalizeStatus(
              project.status
            );

            return (
              <div
                key={project._id}
                className="
                  flex flex-col gap-3 py-4
                  first:pt-0 last:pb-0
                  sm:flex-row sm:items-center sm:justify-between
                "
              >
                <div className="min-w-0">
                  <Link
                    to={`/admin/projects/${project._id}`}
                    className="
                      inline-flex items-center gap-1
                      text-sm font-semibold text-[#07152F]
                      transition-colors hover:text-[#1556D6]
                    "
                  >
                    {project.projectReference}
                    <ArrowUpRight size={14} strokeWidth={1.8} />
                  </Link>

                  <p className="mt-1 truncate text-sm text-slate-600">
                    {project.title}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-400">
                    {project.clientSnapshot.fullName}
                  </p>
                </div>

                <div className="
                  flex shrink-0 items-center justify-between gap-3
                  sm:flex-col sm:items-end sm:gap-2
                ">
                  <span
                    className={`
                      inline-flex items-center rounded-md
                      px-2.5 py-1 text-xs font-medium
                      ${
                        statusStyles[normalizedStatus] ??
                        "bg-slate-100 text-slate-600"
                      }
                    `}
                  >
                    {formatStatus(project.status)}
                  </span>

                  <span className="text-xs tabular-nums text-slate-400">
                    Due: {formatDate(project.expectedCompletionDate)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RecentProjects;