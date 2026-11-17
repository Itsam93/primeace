import {
  useCallback,
  useEffect,
  useState
} from "react";

import type { FormEvent } from "react";

import { Link } from "react-router-dom";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  RefreshCw,
  Search
} from "lucide-react";

import { ApiError } from "../../../lib/api.js";

import {
  getServiceRequests
} from "../services/serviceRequest.Service.js";

import type {
  IServiceRequestListItem,
  IServiceRequestListParams,
  IServiceRequestPaginationMeta,
  ServiceRequestStatus
} from "../types/serviceRequest.types.js";

const PAGE_SIZE = 10;

function getStatusStyles(status: ServiceRequestStatus): string {
  switch (status) {
    case "new":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "under_review":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "awaiting_information":
      return "bg-orange-50 text-orange-700 ring-orange-600/20";

    case "quoted":
      return "bg-violet-50 text-violet-700 ring-violet-600/20";

    case "converted":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "declined":
      return "bg-red-50 text-red-700 ring-red-600/20";

    case "closed":
      return "bg-slate-100 text-slate-600 ring-slate-500/20";

    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }
}

function getStatusLabel(status: ServiceRequestStatus): string {
  const labels: Record<ServiceRequestStatus, string> = {
    new: "New",
    under_review: "Under Review",
    awaiting_information: "Awaiting Information",
    quoted: "Quoted",
    converted: "Converted",
    declined: "Declined",
    closed: "Closed"
  };

  return labels[status];
}

function formatDate(value: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatTime(value: string): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function getServiceNames(
  items: IServiceRequestListItem["items"]
): string[] {
  return [...new Set(items.map((item) => item.serviceName))];
}

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<IServiceRequestListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<ServiceRequestStatus | "">("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] =
    useState<IServiceRequestPaginationMeta>({
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 0
    });

  const loadRequests = useCallback(
    async (showRefreshIndicator = false) => {
      try {
        setError("");

        if (showRefreshIndicator) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const params: IServiceRequestListParams = {
          page,
          limit: PAGE_SIZE,
          sortBy: "submittedAt",
          sortOrder: "desc"
        };

        if (search) {
          params.search = search;
        }

        if (status) {
          params.status = status;
        }

        const result = await getServiceRequests(params);

        setRequests(result.requests);
        setPagination(result.pagination);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load service requests. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, status]
  );

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextSearch = searchInput.trim();

    if (nextSearch === search) return;

    setPage(1);
    setSearch(nextSearch);
  };

  const handleStatusChange = (value: string) => {
    setPage(1);
    setStatus(value as ServiceRequestStatus | "");
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(search) || Boolean(status);

  const firstRecord =
    pagination.total === 0
      ? 0
      : (page - 1) * PAGE_SIZE + 1;

  const lastRecord = Math.min(
    page * PAGE_SIZE,
    pagination.total
  );

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <MessageSquareText size={16} />
            Management
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Service Requests
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review and manage service enquiries submitted by prospective clients.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadRequests(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />

          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-500">
          Total requests
        </p>

        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {pagination.total.toLocaleString("en-NG")}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {hasActiveFilters
            ? "Requests matching the current filters"
            : "All submitted service requests"}
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Filter service requests
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Search by request reference or client information and filter by request status.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <form
            onSubmit={handleSearch}
            className="flex flex-1 gap-2"
          >
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search reference, client name, email or phone..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="under_review">Under Review</option>
              <option value="awaiting_information">
                Awaiting Information
              </option>
              <option value="quoted">Quoted</option>
              <option value="converted">Converted</option>
              <option value="declined">Declined</option>
              <option value="closed">Closed</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading error */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Unable to load service requests
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadRequests()}
            disabled={loading}
            className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Try again
          </button>
        </div>
      )}

      {/* Requests table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Submitted requests
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Service enquiries received from clients
            </p>
          </div>

          <span className="text-xs font-medium text-slate-500">
            {pagination.total.toLocaleString("en-NG")} records
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <RefreshCw
                size={18}
                className="animate-spin text-blue-600"
              />

              Loading service requests...
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <MessageSquareText
                size={22}
                className="text-slate-400"
              />
            </div>

            <h3 className="font-semibold text-slate-900">
              No service requests found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {hasActiveFilters
                ? "No requests match your current filters. Try changing or clearing them."
                : "There are no service requests to display yet."}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Request
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Client
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Services requested
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Submitted
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {requests.map((request) => {
                    const serviceNames = getServiceNames(
                      request.items
                    );

                    return (
                      <tr
                        key={request._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <Link
                            to={`/admin/requests/${request._id}`}
                            className="text-sm font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
                          >
                            {request.reference}
                          </Link>

                          <p className="mt-1 text-xs text-slate-400">
                            {request.items.length}{" "}
                            {request.items.length === 1
                              ? "service item"
                              : "service items"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {request.clientSnapshot.fullName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {request.clientSnapshot.email || "No email provided"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {request.clientSnapshot.phone}
                          </p>
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {serviceNames.slice(0, 2).map((name) => (
                              <span
                                key={name}
                                className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                              >
                                {name}
                              </span>
                            ))}

                            {serviceNames.length > 2 && (
                              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                +{serviceNames.length - 2} more
                              </span>
                            )}

                            {serviceNames.length === 0 && (
                              <span className="text-xs text-slate-400">
                                No services listed
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyles(request.status)}`}
                          >
                            {getStatusLabel(request.status)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="text-sm font-medium text-slate-700">
                            {formatDate(request.submittedAt)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatTime(request.submittedAt)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {firstRecord}–{lastRecord}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {pagination.total}
                </span>{" "}
                requests
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="px-2 text-sm font-medium text-slate-600">
                  {page} / {Math.max(pagination.totalPages, 1)}
                </span>

                <button
                  type="button"
                  disabled={
                    page >= pagination.totalPages ||
                    loading ||
                    pagination.totalPages === 0
                  }
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
