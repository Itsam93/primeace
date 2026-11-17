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
  FileText,
  Plus,
  RefreshCw,
  Search
} from "lucide-react";

import { QuotationStatus } from "@primeace/shared";

import { ApiError } from "../../../lib/api.js";

import { getQuotations } from "../services/quotation.service.js";

import type {
  IQuotation,
  IQuotationListParams,
  IQuotationPaginationMeta
} from "../types/quotation.types.js";

const PAGE_SIZE = 10;

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric"
});

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2
});

const statusOptions = [
  { value: QuotationStatus.DRAFT, label: "Draft" },
  { value: QuotationStatus.SENT, label: "Sent" },
  { value: QuotationStatus.APPROVED, label: "Approved" },
  { value: QuotationStatus.DECLINED, label: "Declined" },
  {
    value: QuotationStatus.REVISION_REQUESTED,
    label: "Revision requested"
  },
  { value: QuotationStatus.EXPIRED, label: "Expired" },
  { value: QuotationStatus.WITHDRAWN, label: "Withdrawn" }
];

const sortOptions = [
  { value: "createdAt", label: "Date created" },
  { value: "updatedAt", label: "Last updated" },
  { value: "quotationNumber", label: "Quotation number" },
  { value: "validUntil", label: "Validity date" },
  { value: "totalAmountKobo", label: "Total amount" },
  { value: "status", label: "Status" }
] as const;

type QuotationSortField =
  NonNullable<IQuotationListParams["sortBy"]>;

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return dateFormatter.format(date);
}

function formatAmount(amountKobo: number): string {
  return currencyFormatter.format(amountKobo / 100);
}

function getStatusLabel(status: QuotationStatus): string {
  return statusOptions.find(
    (option) => option.value === status
  )?.label ?? status;
}

function getStatusClasses(status: QuotationStatus): string {
  switch (status) {
    case QuotationStatus.DRAFT:
      return "bg-slate-100 text-slate-700";

    case QuotationStatus.SENT:
      return "bg-blue-50 text-blue-700";

    case QuotationStatus.APPROVED:
      return "bg-emerald-50 text-emerald-700";

    case QuotationStatus.DECLINED:
      return "bg-red-50 text-red-700";

    case QuotationStatus.REVISION_REQUESTED:
      return "bg-amber-50 text-amber-700";

    case QuotationStatus.EXPIRED:
      return "bg-orange-50 text-orange-700";

    case QuotationStatus.WITHDRAWN:
      return "bg-slate-100 text-slate-500";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function QuotationsPage() {
  const [quotations, setQuotations] = useState<IQuotation[]>([]);
  const [pagination, setPagination] =
    useState<IQuotationPaginationMeta>({
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 0
    });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuotationStatus | "">("");
  const [sortBy, setSortBy] =
    useState<QuotationSortField>("createdAt");
  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("desc");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadQuotations = useCallback(
    async (page: number, refreshing = false) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError("");

      const params: IQuotationListParams = {
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder
      };

      if (search) params.search = search;
      if (status) params.status = status;

      try {
        const result = await getQuotations(params);

        setQuotations(result.quotations);
        setPagination(result.pagination);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load quotations. Please try again."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [search, status, sortBy, sortOrder]
  );

  useEffect(() => {
    void loadQuotations(1);
  }, [loadQuotations]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  const handleStatusChange = (
    value: QuotationStatus | ""
  ) => {
    setStatus(value);
  };

  const handleSortChange = (
    value: QuotationSortField
  ) => {
    setSortBy(value);
  };

  const handleSortOrderChange = (
    value: "asc" | "desc"
  ) => {
    setSortOrder(value);
  };

  const handleRefresh = () => {
    void loadQuotations(pagination.page, true);
  };

  const handlePageChange = (page: number) => {
    if (
      page < 1 ||
      page > pagination.totalPages ||
      page === pagination.page
    ) {
      return;
    }

    void loadQuotations(page);
  };

  const hasPreviousPage = pagination.page > 1;
  const hasNextPage =
    pagination.page < pagination.totalPages;

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-[#1556D6]">
            Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#07152F] sm:text-3xl">
            Quotations
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create, manage and track client quotations.
          </p>
        </div>

        <Link
          to="/admin/quotations/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1556D6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Create quotation
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-[#07152F]">
              Quotation directory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {pagination.total}{" "}
              {pagination.total === 1
                ? "quotation"
                : "quotations"}{" "}
              found
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={
                isRefreshing ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>

        <form
          onSubmit={handleSearch}
          className="mb-5 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Search quotation number, client or request..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-[#07152F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#10264a]"
          >
            Search
          </button>

          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </form>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor="quotation-status"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Status
            </label>

            <select
              id="quotation-status"
              value={status}
              onChange={(event) =>
                handleStatusChange(
                  event.target.value as QuotationStatus | ""
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All statuses</option>

              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="quotation-sort"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Sort by
            </label>

            <select
              id="quotation-sort"
              value={sortBy}
              onChange={(event) =>
                handleSortChange(
                  event.target.value as QuotationSortField
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="quotation-order"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Sort order
            </label>

            <select
              id="quotation-order"
              value={sortOrder}
              onChange={(event) =>
                handleSortOrderChange(
                  event.target.value as "asc" | "desc"
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
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
              onClick={() =>
                void loadQuotations(pagination.page)
              }
              className="self-start text-sm font-semibold text-red-700 hover:text-red-900"
            >
              Try again
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <RefreshCw
                size={18}
                className="animate-spin"
              />
              Loading quotations...
            </div>
          </div>
        ) : quotations.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-[#07152F]">
              No quotations found
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search || status
                ? "Try adjusting your search or status filter."
                : "Quotations you create will appear here."}
            </p>

            {!search && !status && (
              <Link
                to="/admin/quotations/new"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1556D6] hover:text-blue-800"
              >
                <Plus size={17} />
                Create your first quotation
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-4 font-semibold">
                      Quotation
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Client
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Service request
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Total
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Valid until
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-4 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {quotations.map((quotation) => (
                    <QuotationRow
                      key={quotation._id}
                      quotation={quotation}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page {pagination.page} of{" "}
                {Math.max(pagination.totalPages, 1)}
                <span className="mx-2 text-slate-300">·</span>
                {pagination.total} total quotations
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(pagination.page - 1)
                  }
                  disabled={!hasPreviousPage}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(pagination.page + 1)
                  }
                  disabled={!hasNextPage}
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

function QuotationRow({
  quotation
}: {
  quotation: IQuotation;
}) {
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-4 py-4">
        <Link
          to={`/admin/quotations/${encodeURIComponent(quotation._id)}`}
          className="font-semibold text-[#1556D6] hover:text-blue-800"
        >
          {quotation.quotationNumber}
        </Link>

        <p className="mt-1 text-xs text-slate-400">
          Version {quotation.version}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="text-sm font-medium text-slate-700">
          {quotation.clientSnapshot.fullName}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {quotation.clientSnapshot.email ||
            quotation.clientSnapshot.phone}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="text-sm text-slate-700">
          {quotation.serviceRequestReference}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="text-sm font-semibold tabular-nums text-[#07152F]">
          {formatAmount(quotation.totalAmountKobo)}
        </p>
      </td>

      <td className="px-4 py-4 text-sm text-slate-600">
        {formatDate(quotation.validUntil)}
      </td>

      <td className="px-4 py-4">
        <span
          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(quotation.status)}`}
        >
          {getStatusLabel(quotation.status)}
        </span>
      </td>

      <td className="px-4 py-4 text-right">
        <Link
          to={`/admin/quotations/${encodeURIComponent(quotation._id)}`}
          className="text-sm font-semibold text-[#1556D6] hover:text-blue-800"
        >
          View details
        </Link>
      </td>
    </tr>
  );
}

export default QuotationsPage;
