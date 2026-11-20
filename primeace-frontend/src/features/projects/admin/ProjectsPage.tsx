import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";

import {
  AlertCircle,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search
} from "lucide-react";

import {
  ProjectSource,
  ProjectStatus
} from "@primeace/shared";

import { ApiError } from "../../../lib/api.js";

import { getProjects } from "../services/project.service.js";

import type {
  IListProjectsQuery,
  ProjectListItem
} from "../types/project.types.js";

const PAGE_SIZE = 10;

const statusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.NOT_STARTED]: "Not started",
  [ProjectStatus.IN_PROGRESS]: "In progress",
  [ProjectStatus.UNDER_REVIEW]: "Under review",
  [ProjectStatus.ON_HOLD]: "On hold",
  [ProjectStatus.COMPLETED]: "Completed",
  [ProjectStatus.CANCELLED]: "Cancelled"
};

const statusStyles: Record<ProjectStatus, string> = {
  [ProjectStatus.NOT_STARTED]: "bg-gray-100 text-gray-700",
  [ProjectStatus.IN_PROGRESS]: "bg-blue-100 text-blue-700",
  [ProjectStatus.UNDER_REVIEW]: "bg-purple-100 text-purple-700",
  [ProjectStatus.ON_HOLD]: "bg-amber-100 text-amber-700",
  [ProjectStatus.COMPLETED]: "bg-green-100 text-green-700",
  [ProjectStatus.CANCELLED]: "bg-red-100 text-red-700"
};

const sourceLabels: Record<ProjectSource, string> = {
  [ProjectSource.CONTRACT]: "Contract",
  [ProjectSource.HISTORICAL]: "Historical"
};

const sourceStyles: Record<ProjectSource, string> = {
  [ProjectSource.CONTRACT]: "bg-blue-50 text-blue-700",
  [ProjectSource.HISTORICAL]: "bg-amber-50 text-amber-700"
};

function formatCurrency(amountKobo: number | null): string {
  if (amountKobo === null) return "—";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2
  }).format(amountKobo / 100);
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const requestIdRef = useRef(0);

  const fetchProjects = useCallback(
    async (showRefresh = false) => {
      const requestId = ++requestIdRef.current;

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const query: IListProjectsQuery = {
          page,
          limit: PAGE_SIZE,
          sortBy: "createdAt",
          sortOrder: "desc"
        };

        if (search.trim()) {
          query.search = search.trim();
        }

        if (status) {
          query.status = status as ProjectStatus;
        }

        if (source) {
          query.source = source as ProjectSource;
        }

        const result = await getProjects(query);

        if (requestId !== requestIdRef.current) return;

        setProjects(result.projects);
        setTotalPages(Math.max(result.pagination.totalPages, 1));
        setTotal(result.pagination.total);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;

        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load projects. Please try again."
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [page, search, status, source]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchProjects();
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [fetchProjects]);

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handleSourceChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    setSource(event.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    void fetchProjects(true);
  };

  const hasActiveFilters = Boolean(
    search.trim() || status || source
  );

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Projects
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage contract projects and previously completed work.
          </p>
        </div>

        <Link
          to="/admin/projects/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
        >
          <Plus size={17} />
          Add historical project
        </Link>
      </div>

      {/* Search and filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search project reference, client or title..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={source}
            onChange={handleSourceChange}
            aria-label="Filter by project source"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All project sources</option>

            {Object.values(ProjectSource).map((value) => (
              <option key={value} value={value}>
                {sourceLabels[value]}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={handleStatusChange}
            aria-label="Filter by project status"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All statuses</option>

            {Object.values(ProjectStatus).map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <div>
            <p className="font-medium">
              Unable to load projects
            </p>

            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Projects table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            All projects
          </h2>

          <span className="text-sm text-gray-500">
            {total} {total === 1 ? "project" : "projects"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="mb-3 rounded-full bg-gray-100 p-4">
              <BriefcaseBusiness size={26} className="text-gray-500" />
            </div>

            <h3 className="font-medium text-gray-900">
              No projects found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {hasActiveFilters
                ? "Try changing your search or filters."
                : "Projects created from accepted contracts and historical projects will appear here."}
            </p>

            {!hasActiveFilters && (
              <Link
                to="/admin/projects/new"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                <Plus size={16} />
                Add historical project
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">
                      Project
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Source
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Client
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Category
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Services
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Amount
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-3 font-medium">
                      Expected completion
                    </th>

                    <th className="px-5 py-3 font-medium text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/projects/${project.id}`}
                          className="font-medium text-blue-700 hover:text-blue-800"
                        >
                          {project.projectReference}
                        </Link>

                        <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                          {project.title}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${sourceStyles[project.source]}`}
                        >
                          {sourceLabels[project.source]}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {project.clientSnapshot.fullName}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {project.clientSnapshot.phone}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {project.category ? (
                          <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700">
                            {project.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex max-w-xs flex-wrap gap-1.5">
                          {project.serviceNames.length > 0 ? (
                            project.serviceNames.map((service, index) => (
                              <span
                                key={`${service}-${index}`}
                                className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
                              >
                                {service}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">
                        {formatCurrency(project.contractAmountKobo)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[project.status]}`}
                        >
                          {statusLabels[project.status]}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatDate(project.expectedCompletionDate)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/projects/${project.id}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1));
                  }}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPage((current) => Math.min(totalPages, current + 1));
                  }}
                  disabled={page >= totalPages || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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