import { ArrowUpRight, Inbox } from "lucide-react";
import { Link } from "react-router-dom";

import type {
  IServiceRequestListItem
} from "./service-request.type.js";

import ServiceRequestStatusBadge from "./ServiceRequestStatusBadge.js";

interface IServiceRequestTableProps {
  requests: IServiceRequestListItem[];
}

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(parsedDate);
}

function ServiceRequestTable({
  requests
}: IServiceRequestTableProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Inbox size={25} />
        </div>

        <h3 className="text-base font-semibold text-slate-800">
          No service requests found
        </h3>

        <p className="mt-2 max-w-sm text-sm text-slate-500">
          There are no service requests matching your current search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Request
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Client
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Services
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Submitted
              </th>

              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>

              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {requests.map((request) => (
              <tr
                key={request._id}
                className="transition hover:bg-slate-50/80"
              >
                <td className="px-6 py-5">
                  <p className="text-sm font-semibold text-slate-800">
                    {request.reference}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {request.items.length}{" "}
                    {request.items.length === 1 ? "service" : "services"}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <p className="text-sm font-medium text-slate-800">
                    {request.clientSnapshot.fullName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {request.clientSnapshot.email ||
                      request.clientSnapshot.phone}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <div className="max-w-[220px] space-y-1">
                    {request.items.slice(0, 2).map((item) => (
                      <p
                        key={`${request._id}-${item.serviceId}`}
                        className="truncate text-sm text-slate-600"
                        title={item.serviceName}
                      >
                        {item.serviceName}
                      </p>
                    ))}

                    {request.items.length > 2 && (
                      <p className="text-xs font-medium text-blue-600">
                        +{request.items.length - 2} more
                      </p>
                    )}
                  </div>
                </td>

                <td className="px-6 py-5">
                  <p className="whitespace-nowrap text-sm text-slate-600">
                    {formatDate(request.submittedAt)}
                  </p>
                </td>

                <td className="px-6 py-5">
                  <ServiceRequestStatusBadge status={request.status} />
                </td>

                <td className="px-6 py-5 text-right">
                  <Link
                    to={`/admin/requests/${request._id}`}
                    aria-label={`View request ${request.reference}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                  >
                    View
                    <ArrowUpRight size={15} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ServiceRequestTable;
