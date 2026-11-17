import {
  Activity,
  Clock3,
  UserRound
} from "lucide-react";

import DashboardSectionHeader from "./DashboardSectionHeader.js";

import type {
  IDashboardActivity
} from "../dashboard.type.js";

interface IRecentActivityProps {
  activities: IDashboardActivity[];
}

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(parsedDate);
}

function formatResourceType(resourceType: string): string {
  return resourceType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function RecentActivity({
  activities
}: IRecentActivityProps) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <DashboardSectionHeader
        title="Recent Activity"
        description="Recent actions recorded across the workspace."
      />

      {activities.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
            <Activity size={20} strokeWidth={1.8} />
          </div>

          <p className="mt-4 text-sm font-semibold text-[#07152F]">
            No recent activity
          </p>

          <p className="mt-1 max-w-xs text-sm leading-5 text-slate-500">
            Recorded administrative activity will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 divide-y divide-slate-100">
          {activities.map((item) => (
            <div
              key={item._id}
              className="flex gap-3 py-4 first:pt-0 last:pb-0"
            >
              <div className="
                flex h-9 w-9 shrink-0 items-center justify-center
                rounded-lg bg-blue-50 text-[#1556D6]
              ">
                <UserRound size={17} strokeWidth={1.8} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-[#07152F]">
                    {item.actorId?.fullName ?? "System"}
                  </span>
                  {" "}
                  {item.description}
                </p>

                <div className="
                  mt-1.5 flex flex-wrap items-center
                  gap-x-2 gap-y-1 text-xs text-slate-400
                ">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={12} strokeWidth={1.8} />
                    {formatDate(item.createdAt)}
                  </span>

                  <span aria-hidden="true">·</span>

                  <span>
                    {formatResourceType(item.resourceType)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default RecentActivity;