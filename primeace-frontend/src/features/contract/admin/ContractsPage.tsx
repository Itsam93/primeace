import {
  useCallback,
  useEffect,
  useState
} from "react";

import type { ChangeEvent } from "react";
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

import { ContractStatus } from "@primeace/shared";

import { ApiError } from "../../../lib/api.js";

import { getContracts } from "../services/contract.service.js";

import type {
  IContract,
  IListContractsQuery
} from "../types/contract.types.js";

const PAGE_SIZE = 10;

const statusLabels: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: "Draft",
  [ContractStatus.ISSUED]: "Issued",
  [ContractStatus.ACCEPTED]: "Accepted",
  [ContractStatus.REJECTED]: "Rejected",
  [ContractStatus.EXPIRED]: "Expired",
  [ContractStatus.WITHDRAWN]: "Withdrawn"
};

const statusStyles: Record<ContractStatus, string> = {
  [ContractStatus.DRAFT]: "bg-gray-100 text-gray-700",
  [ContractStatus.ISSUED]: "bg-blue-100 text-blue-700",
  [ContractStatus.ACCEPTED]: "bg-green-100 text-green-700",
  [ContractStatus.REJECTED]: "bg-red-100 text-red-700",
  [ContractStatus.EXPIRED]: "bg-amber-100 text-amber-700",
  [ContractStatus.WITHDRAWN]: "bg-gray-100 text-gray-600"
};

function formatCurrency(amountKobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2
  }).format(amountKobo / 100);
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function getContractDisplayStatus(
  contract: IContract
): ContractStatus {
  if (
    contract.status === ContractStatus.ISSUED &&
    contract.acceptanceDeadline &&
    new Date(contract.acceptanceDeadline).getTime() <= Date.now()
  ) {
    return ContractStatus.EXPIRED;
  }

  return contract.status;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<IContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchContracts = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const query: IListContractsQuery = {
          page,
          limit: PAGE_SIZE,
          sortBy: "createdAt",
          sortOrder: "desc"
        };

        if (search.trim()) {
          query.search = search.trim();
        }

        if (status) {
          query.status = status as ContractStatus;
        }

        const result = await getContracts(query);

        setContracts(result.contracts);
        setTotalPages(Math.max(result.pagination.totalPages, 1));
        setTotal(result.pagination.total);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load contracts. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, status]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchContracts();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [fetchContracts]);

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

  const handleRefresh = () => {
    void fetchContracts(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Contracts
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create, issue and manage client contracts.
          </p>
        </div>

        <Link
          to="/admin/contracts/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Create contract
        </Link>
      </div>

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
              placeholder="Search contract number, client or title..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={status}
            onChange={handleStatusChange}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All statuses</option>

            {Object.values(ContractStatus).map((value) => (
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

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <div>
            <p className="font-medium">
              Unable to load contracts
            </p>

            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            All contracts
          </h2>

          <span className="text-sm text-gray-500">
            {total} {total === 1 ? "contract" : "contracts"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading contracts...
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="mb-3 rounded-full bg-gray-100 p-4">
              <FileText size={26} className="text-gray-500" />
            </div>

            <h3 className="font-medium text-gray-900">
              No contracts found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {search || status
                ? "Try changing your search or status filter."
                : "Contracts created from approved quotations will appear here."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">
                      Contract
                    </th>
                    <th className="px-5 py-3 font-medium">
                      Client
                    </th>
                    <th className="px-5 py-3 font-medium">
                      Amount
                    </th>
                    <th className="px-5 py-3 font-medium">
                      Status
                    </th>
                    <th className="px-5 py-3 font-medium">
                      Created
                    </th>
                    <th className="px-5 py-3 font-medium">
                      Completion
                    </th>
                    <th className="px-5 py-3 font-medium text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {contracts.map((contract) => {
                    const displayStatus =
                      getContractDisplayStatus(contract);

                    return (
                      <tr
                        key={contract._id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <Link
                            to={`/admin/contracts/${contract._id}`}
                            className="font-medium text-blue-700 hover:text-blue-800"
                          >
                            {contract.contractNumber}
                          </Link>

                          <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                            {contract.title}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Version {contract.version}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">
                            {contract.clientSnapshot.fullName}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {contract.clientSnapshot.phone}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">
                          {formatCurrency(contract.contractAmountKobo)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[displayStatus]}`}
                          >
                            {statusLabels[displayStatus]}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                          {formatDate(contract.createdAt)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                          {formatDate(contract.expectedCompletionDate)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            to={`/admin/contracts/${contract._id}`}
                            className="font-medium text-blue-700 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
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