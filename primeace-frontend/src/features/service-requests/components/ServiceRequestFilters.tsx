import { Search, X } from "lucide-react";

import type {
  RequestStatus
} from "./service-request.type.js";

export interface IServiceRequestFilters {
  search: string;
  status: RequestStatus | "";
  submittedFrom: string;
  submittedTo: string;
  sortBy: "submittedAt" | "createdAt" | "status";
  sortOrder: "asc" | "desc";
}

interface IServiceRequestFiltersProps {
  filters: IServiceRequestFilters;
  onChange: (filters: IServiceRequestFilters) => void;
  onReset: () => void;
}

const statusOptions: {
  label: string;
  value: RequestStatus;
}[] = [
  { label: "New", value: "new" },
  { label: "Under Review", value: "under_review" },
  { label: "Awaiting Information", value: "awaiting_information" },
  { label: "Quoted", value: "quoted" },
  { label: "Converted", value: "converted" },
  { label: "Declined", value: "declined" },
  { label: "Closed", value: "closed" }
];

function ServiceRequestFilters({
  filters,
  onChange,
  onReset
}: IServiceRequestFiltersProps) {
  const updateFilter = <K extends keyof IServiceRequestFilters>(
    key: K,
    value: IServiceRequestFilters[K]
  ) => {
    onChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "" ||
    filters.submittedFrom !== "" ||
    filters.submittedTo !== "" ||
    filters.sortBy !== "submittedAt" ||
    filters.sortOrder !== "desc";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={filters.search}
            onChange={(event) =>
              updateFilter("search", event.target.value)
            }
            placeholder="Search by reference, client name, email or phone..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label
              htmlFor="request-status"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              Request Status
            </label>

            <select
              id="request-status"
              value={filters.status}
              onChange={(event) =>
                updateFilter(
                  "status",
                  event.target.value as RequestStatus | ""
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All statuses</option>

              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="submitted-from"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              Submitted From
            </label>

            <input
              id="submitted-from"
              type="date"
              value={filters.submittedFrom}
              max={filters.submittedTo || undefined}
              onChange={(event) =>
                updateFilter("submittedFrom", event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="submitted-to"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              Submitted To
            </label>

            <input
              id="submitted-to"
              type="date"
              value={filters.submittedTo}
              min={filters.submittedFrom || undefined}
              onChange={(event) =>
                updateFilter("submittedTo", event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="request-sort"
              className="mb-2 block text-xs font-semibold text-slate-600"
            >
              Sort By
            </label>

            <select
              id="request-sort"
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(":");

                updateFilter("sortBy", sortBy as IServiceRequestFilters["sortBy"]);
                updateFilter("sortOrder", sortOrder as IServiceRequestFilters["sortOrder"]);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="submittedAt:desc">Newest submissions</option>
              <option value="submittedAt:asc">Oldest submissions</option>
              <option value="createdAt:desc">Recently created</option>
              <option value="createdAt:asc">Oldest created</option>
              <option value="status:asc">Status (A–Z)</option>
              <option value="status:desc">Status (Z–A)</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
            >
              <X size={15} />
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default ServiceRequestFilters;
