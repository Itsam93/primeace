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
  Plus,
  RefreshCw,
  Search,
  Users,
  X
} from "lucide-react";

import { ApiError } from "../../../lib/api.js";

import { getClients } from "../services/client.service.js";

import CreateClientModal from "./CreateClientModal.js";

import type {
  IClient,
  IClientListParams,
  IClientPaginationMeta
} from "../types/client.types.js";

const PAGE_SIZE = 10;

type ClientSortField =
  | "fullName"
  | "createdAt"
  | "updatedAt";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function ClientsPage() {
  const [clients, setClients] = useState<IClient[]>([]);
  const [pagination, setPagination] =
    useState<IClientPaginationMeta | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] =
    useState<ClientSortField>("createdAt");

  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const [error, setError] = useState("");

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params: IClientListParams = {
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder
      };

      if (search) {
        params.search = search;
      }

      const result = await getClients(params);

      setClients(result.clients);
      setPagination(result.pagination);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to retrieve clients. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const handleSearch = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleSortChange = (
    value: ClientSortField
  ) => {
    setSortBy(value);
    setPage(1);
  };

  const handleSortOrderChange = (
    value: "asc" | "desc"
  ) => {
    setSortOrder(value);
    setPage(1);
  };

  const handleRefresh = () => {
    void loadClients();
  };

  const handleClientCreated = () => {
    setIsCreateModalOpen(false);

    // Show the newly created client at the top of the directory.
    setSearchInput("");
    setSearch("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);

    // The effect reloads the directory when its query state changes.
    // If the query is already at its default, refresh directly.
    if (
      page === 1 &&
      search === "" &&
      sortBy === "createdAt" &&
      sortOrder === "desc"
    ) {
      void loadClients();
    }
  };

  const totalClients = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Page Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <span>Management</span>
            <span>/</span>
            <span className="font-medium text-[#1556D6]">
              Clients
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#07152F] sm:text-3xl">
            Clients
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View and manage your client records.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1556D6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={17} />
            New Client
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={isLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1556D6]">
            <Users size={23} />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Total Registered Clients
            </p>

            <p className="mt-1 text-2xl font-bold tabular-nums text-[#07152F]">
              {isLoading && pagination === null
                ? "—"
                : totalClients.toLocaleString("en-NG")}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-[#07152F]">
            Client Directory
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Search and browse your registered clients.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 lg:flex-row"
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search by name, email, phone or organisation..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1556D6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Search size={16} />
            Search
          </button>

          {(search || searchInput) && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </form>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <label
              htmlFor="client-sort"
              className="text-sm font-medium text-slate-600"
            >
              Sort by
            </label>

            <select
              id="client-sort"
              value={sortBy}
              onChange={(event) =>
                handleSortChange(
                  event.target.value as ClientSortField
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
            >
              <option value="createdAt">
                Registration date
              </option>
              <option value="fullName">
                Client name
              </option>
              <option value="updatedAt">
                Last updated
              </option>
            </select>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label
              htmlFor="client-sort-order"
              className="text-sm font-medium text-slate-600"
            >
              Order
            </label>

            <select
              id="client-sort-order"
              value={sortOrder}
              onChange={(event) =>
                handleSortOrderChange(
                  event.target.value as "asc" | "desc"
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="shrink-0 text-sm font-semibold text-red-700 hover:text-red-900"
          >
            Try again
          </button>
        </div>
      )}

      {/* Client Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <h2 className="font-semibold text-[#07152F]">
            Registered Clients
          </h2>

          <p className="text-xs text-slate-500">
            {isLoading
              ? "Loading clients..."
              : `${clients.length} of ${totalClients.toLocaleString("en-NG")} clients`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Contact Information</th>
                <th className="px-6 py-4">Organisation</th>
                <th className="px-6 py-4">Registered</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading && clients.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center text-sm text-slate-500"
                  >
                    <RefreshCw
                      size={22}
                      className="mx-auto mb-3 animate-spin text-[#1556D6]"
                    />
                    Loading clients...
                  </td>
                </tr>
              )}

              {!isLoading && !error && clients.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center"
                  >
                    <Users
                      size={30}
                      className="mx-auto mb-3 text-slate-300"
                    />

                    <p className="font-medium text-slate-700">
                      No clients found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {search
                        ? "Try a different search term."
                        : "Add a client or wait for a service request to be submitted."}
                    </p>
                  </td>
                </tr>
              )}

              {clients.map((client) => (
                <tr
                  key={client._id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-[#1556D6]">
                        {getInitials(client.fullName)}
                      </div>

                      <div>
                        <p className="font-semibold text-[#07152F]">
                          {client.fullName}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Client record
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">
                      {client.email || "No email provided"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {client.phone}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {client.organisation || "—"}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(client.createdAt)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/admin/clients/${encodeURIComponent(client._id)}`}
                      className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-[#1556D6] transition hover:bg-blue-50"
                    >
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 0 && (
          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {totalClients === 0
                  ? 0
                  : (page - 1) * PAGE_SIZE + 1}
                {" - "}
                {Math.min(page * PAGE_SIZE, totalClients)}
              </span>
              {" "}of{" "}
              <span className="font-medium text-slate-700">
                {totalClients}
              </span>
              {" "}clients
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                disabled={!pagination.hasPreviousPage || isLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="px-2 text-sm text-slate-600">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) => current + 1)
                }
                disabled={!pagination.hasNextPage || isLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      {isCreateModalOpen && (
        <CreateClientModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleClientCreated}
        />
      )}
    </div>
  );
}

export default ClientsPage;
