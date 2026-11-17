import { RefreshCw, TriangleAlert } from "lucide-react";

interface IDashboardErrorProps {
  message: string;
  onRetry: () => void;
}

function DashboardError({
  message,
  onRetry
}: IDashboardErrorProps) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <TriangleAlert size={22} />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-[#07152F]">
        Unable to load dashboard
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1556D6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </div>
  );
}

export default DashboardError;
