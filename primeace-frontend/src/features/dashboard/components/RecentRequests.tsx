import { Link } from "react-router-dom";
import { ArrowUpRight, Inbox } from "lucide-react";

import DashboardSectionHeader from "./DashboardSectionHeader.js";

import type {
  IDashboardRequest
} from "../dashboard.type.js";

interface IRecentRequestsProps {
  requests: IDashboardRequest[];
}

const statusStyles: Record<string, string> = {
  new: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  awaiting_information: "bg-orange-50 text-orange-700",
  quoted: "bg-violet-50 text-violet-700",
  converted: "bg-emerald-50 text-emerald-700",
  declined: "bg-red-50 text-red-700",
  closed: "bg-slate-100 text-slate-600"
};

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parsedDate);
}

function RecentRequests({
  requests
}: IRecentRequestsProps) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <DashboardSectionHeader
        title="Recent Service Requests"
        description="The latest requests submitted by clients."
        actionLabel="View all"
        actionHref="/admin/service-requests"
      />

      {requests.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
            <Inbox size={20} strokeWidth={1.8} />
          </div>

          <p className="mt-4 text-sm font-semibold text-[#07152F]">
            No service requests yet
          </p>

          <p className="mt-1 max-w-xs text-sm leading-5 text-slate-500">
            New client submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 divide-y divide-slate-100">
          {requests.map((request) => (
            <div
              key={request._id}
              className="
                flex flex-col gap-3 py-4
                first:pt-0 last:pb-0
                sm:flex-row sm:items-center sm:justify-between
              "
            >
              <div className="min-w-0">
                <Link
                  to={`/admin/service-requests/${request._id}`}
                  className="
                    inline-flex items-center gap-1
                    text-sm font-semibold text-[#07152F]
                    transition-colors hover:text-[#1556D6]
                  "
                >
                  {request.reference}
                  <ArrowUpRight size={14} strokeWidth={1.8} />
                </Link>

                <p className="mt-1 truncate text-sm text-slate-600">
                  {request.clientSnapshot.fullName}
                </p>

                <p className="mt-1 truncate text-xs text-slate-400">
                  {request.clientSnapshot.email ||
                    request.clientSnapshot.phone}
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
                      statusStyles[request.status] ??
                      "bg-slate-100 text-slate-600"
                    }
                  `}
                >
                  {formatStatus(request.status)}
                </span>

                <span className="text-xs tabular-nums text-slate-400">
                  {formatDate(
                    request.submittedAt || request.createdAt
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default RecentRequests;