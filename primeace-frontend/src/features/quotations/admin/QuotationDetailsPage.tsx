import {
  useCallback,
  useEffect,
  useState
} from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  FileText,
  RefreshCw,
  RotateCcw,
  Send,
  XCircle
} from "lucide-react";

import { QuotationStatus } from "@primeace/shared";

import { ApiError } from "../../../lib/api.js";

import {
  createQuotationRevision,
  getQuotationById,
  issueQuotation,
  withdrawQuotation
} from "../services/quotation.service.js";

import type {
  IQuotation
} from "../types/quotation.types.js";

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : dateFormatter.format(date);
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : dateTimeFormatter.format(date);
}

function formatAmount(amountKobo: number): string {
  return currencyFormatter.format(amountKobo / 100);
}

function getStatusLabel(status: QuotationStatus): string {
  const labels: Record<QuotationStatus, string> = {
    [QuotationStatus.DRAFT]: "Draft",
    [QuotationStatus.SENT]: "Sent",
    [QuotationStatus.APPROVED]: "Approved",
    [QuotationStatus.DECLINED]: "Declined",
    [QuotationStatus.REVISION_REQUESTED]: "Revision requested",
    [QuotationStatus.EXPIRED]: "Expired",
    [QuotationStatus.WITHDRAWN]: "Withdrawn"
  };

  return labels[status];
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

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function QuotationDetailsPage() {
  const { quotationId } = useParams<{
    quotationId: string;
  }>();

  const navigate = useNavigate();

  const [quotation, setQuotation] =
    useState<IQuotation | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [accessUrl, setAccessUrl] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const loadQuotation = useCallback(async () => {
    if (!quotationId) {
      setError("Quotation ID is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await getQuotationById(quotationId);
      setQuotation(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    void loadQuotation();
  }, [loadQuotation]);

  const handleIssue = async () => {
    if (!quotationId || isProcessing) return;

    const confirmed = window.confirm(
      "Issue this quotation? Once issued, its draft details can no longer be edited."
    );

    if (!confirmed) return;

    setIsProcessing(true);
    setError("");
    setActionMessage("");
    setAccessUrl("");
    setCopyMessage("");

    try {
      const result = await issueQuotation(quotationId);

      setQuotation(result.quotation);

      const url = `${window.location.origin}/quotation/${encodeURIComponent(result.accessToken)}`;

      setAccessUrl(url);
      setActionMessage(
        "Quotation issued successfully. Share the secure link with the client."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!quotationId || isProcessing) return;

    const confirmed = window.confirm(
      "Withdraw this quotation? The client's existing access link will be revoked."
    );

    if (!confirmed) return;

    setIsProcessing(true);
    setError("");
    setActionMessage("");
    setAccessUrl("");

    try {
      const result = await withdrawQuotation(quotationId);

      setQuotation(result);
      setActionMessage("Quotation withdrawn successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateRevision = async () => {
    if (!quotationId || isProcessing) return;

    const confirmed = window.confirm(
      "Create a new draft revision of this quotation?"
    );

    if (!confirmed) return;

    setIsProcessing(true);
    setError("");

    try {
      const result = await createQuotationRevision(quotationId);

      navigate(
        `/admin/quotations/${encodeURIComponent(result._id)}`,
        { replace: true }
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setIsProcessing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!accessUrl) return;

    try {
      await navigator.clipboard.writeText(accessUrl);
      setCopyMessage("Link copied.");
    } catch {
      setCopyMessage(
        "Unable to copy automatically. Select and copy the link above."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw size={18} className="animate-spin" />
          Loading quotation...
        </div>
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div className="space-y-5">
        <Link
          to="/admin/quotations"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1556D6]"
        >
          <ArrowLeft size={17} />
          Back to quotations
        </Link>

        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load quotation
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void loadQuotation()}
                className="mt-4 text-sm font-semibold text-red-800 hover:text-red-950"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quotation) return null;

  const canIssue =
    quotation.status === QuotationStatus.DRAFT;

  const canWithdraw =
    quotation.status === QuotationStatus.SENT;

  const canCreateRevision =
    quotation.status === QuotationStatus.REVISION_REQUESTED;

  return (
    <div className="space-y-7">
      <Link
        to="/admin/quotations"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1556D6]"
      >
        <ArrowLeft size={17} />
        Back to quotations
      </Link>

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-medium text-[#1556D6]">
            Quotation management
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#07152F] sm:text-3xl">
              {quotation.quotationNumber}
            </h1>

            <span
              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(quotation.status)}`}
            >
              {getStatusLabel(quotation.status)}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Version {quotation.version}
            <span className="mx-2 text-slate-300">·</span>
            Created {formatDate(quotation.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canIssue && (
            <button
              type="button"
              onClick={() => void handleIssue()}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1556D6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}
              Issue quotation
            </button>
          )}

          {canWithdraw && (
            <button
              type="button"
              onClick={() => void handleWithdraw()}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle size={17} />
              Withdraw
            </button>
          )}

          {canCreateRevision && (
            <button
              type="button"
              onClick={() => void handleCreateRevision()}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1556D6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <RotateCcw size={17} />
              )}
              Create revision
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {actionMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <Check size={18} className="mt-0.5 shrink-0" />
          <p>{actionMessage}</p>
        </div>
      )}

      {accessUrl && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <ExternalLink
              size={20}
              className="mt-0.5 shrink-0 text-[#1556D6]"
            />

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-[#07152F]">
                Client access link
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                This secure link is available here because it was just
                generated. Copy and send it to the client. You will not
                be able to retrieve this token from the quotation record
                later.
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  readOnly
                  value={accessUrl}
                  aria-label="Client quotation access link"
                  onFocus={(event) => event.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
                />

                <button
                  type="button"
                  onClick={() => void handleCopyLink()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1556D6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {copyMessage === "Link copied." ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                  Copy link
                </button>
              </div>

              {copyMessage && (
                <p className="mt-2 text-xs text-slate-600">
                  {copyMessage}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1556D6]">
              <FileText size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-[#07152F]">
                Client information
              </h2>

              <p className="text-sm text-slate-500">
                Details associated with this quotation
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <DetailField
              label="Client name"
              value={quotation.clientSnapshot.fullName}
            />

            <DetailField
              label="Email address"
              value={quotation.clientSnapshot.email || "Not provided"}
            />

            <DetailField
              label="Phone number"
              value={quotation.clientSnapshot.phone}
            />

            <DetailField
              label="Service request"
              value={quotation.serviceRequestReference}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-[#07152F]">
            Quotation information
          </h2>

          <div className="mt-5 space-y-5">
            <DetailField
              label="Quotation number"
              value={quotation.quotationNumber}
            />

            <DetailField
              label="Version"
              value={String(quotation.version)}
            />

            <DetailField
              label="Created"
              value={formatDateTime(quotation.createdAt)}
            />

            <DetailField
              label="Last updated"
              value={formatDateTime(quotation.updatedAt)}
            />

            <DetailField
              label="Valid until"
              value={formatDate(quotation.validUntil)}
            />

            <DetailField
              label="Issued"
              value={formatDateTime(quotation.issuedAt)}
            />

            <DetailField
              label="Client response"
              value={formatDateTime(quotation.respondedAt)}
            />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-[#07152F]">
            Quotation items
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Services and deliverables included in this quotation
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-3 font-semibold">
                  Service
                </th>

                <th className="px-3 py-3 font-semibold">
                  Description
                </th>

                <th className="px-3 py-3 text-center font-semibold">
                  Quantity
                </th>

                <th className="px-3 py-3 text-right font-semibold">
                  Unit amount
                </th>

                <th className="px-3 py-3 text-right font-semibold">
                  Total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {quotation.items.map((item) => (
                <tr key={item._id}>
                  <td className="px-3 py-4 align-top">
                    <p className="text-sm font-semibold text-slate-700">
                      {item.serviceName}
                    </p>

                    {item.deliverables.length > 0 && (
                      <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-5 text-slate-500">
                        {item.deliverables.map(
                          (deliverable, index) => (
                            <li key={`${item._id}-${index}`}>
                              {deliverable}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                  </td>

                  <td className="max-w-sm whitespace-pre-wrap px-3 py-4 align-top text-sm leading-6 text-slate-600">
                    {item.description}
                  </td>

                  <td className="px-3 py-4 text-center text-sm tabular-nums text-slate-600">
                    {item.quantity}
                  </td>

                  <td className="px-3 py-4 text-right text-sm tabular-nums text-slate-600">
                    {formatAmount(item.unitAmountKobo)}
                  </td>

                  <td className="px-3 py-4 text-right text-sm font-semibold tabular-nums text-[#07152F]">
                    {formatAmount(item.totalAmountKobo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
          <div className="w-full space-y-3 sm:max-w-xs">
            <AmountRow
              label="Subtotal"
              amount={quotation.subtotalKobo}
            />

            <AmountRow
              label="Discount"
              amount={quotation.discountKobo}
            />

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="font-semibold text-[#07152F]">
                Total
              </span>

              <span className="text-xl font-bold tabular-nums text-[#1556D6]">
                {formatAmount(quotation.totalAmountKobo)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-[#07152F]">
            Scope of work
          </h2>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {quotation.scope}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-[#07152F]">
            Terms and conditions
          </h2>

          {quotation.terms.length > 0 ? (
            <ol className="mt-3 list-inside list-decimal space-y-3 text-sm leading-6 text-slate-600">
              {quotation.terms.map((term, index) => (
                <li key={`${index}-${term.slice(0, 20)}`}>
                  {term}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No terms have been added.
            </p>
          )}
        </div>
      </section>

      {quotation.previousVersionId && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-[#07152F]">
            Revision history
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            This quotation is revision {quotation.version}. Its
            previous version is recorded separately as part of the
            quotation audit trail.
          </p>

          <p className="mt-3 break-all text-xs text-slate-400">
            Previous version ID: {quotation.previousVersionId}
          </p>
        </section>
      )}
    </div>
  );
}

function DetailField({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

function AmountRow({
  label,
  amount
}: {
  label: string;
  amount: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>

      <span className="font-medium tabular-nums text-slate-700">
        {formatAmount(amount)}
      </span>
    </div>
  );
}

export default QuotationDetailsPage;
