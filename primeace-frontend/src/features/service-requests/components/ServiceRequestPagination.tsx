import { ChevronLeft, ChevronRight } from "lucide-react";

import type { IPaginationMeta } from "./service-request.type.js";

interface IServiceRequestPaginationProps {
  pagination: IPaginationMeta;
  onPageChange: (page: number) => void;
}

function ServiceRequestPagination({
  pagination,
  onPageChange
}: IServiceRequestPaginationProps) {
  const { page, limit, total, totalPages } = pagination;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700">{start}</span>
        {" "}to{" "}
        <span className="font-semibold text-slate-700">{end}</span>
        {" "}of{" "}
        <span className="font-semibold text-slate-700">{total}</span>
        {" "}requests
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span className="px-2 text-sm text-slate-600">
          Page {page} of {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          disabled={page >= totalPages || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default ServiceRequestPagination;
