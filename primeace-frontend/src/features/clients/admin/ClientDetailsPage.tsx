import {
  useCallback,
  useEffect,
  useState
} from "react";

import { Link, useParams } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  FileText,
  FolderKanban,
  Mail,
  MessageSquareText,
  Phone,
  RefreshCw,
  UserRound,
  Users
} from "lucide-react";

import { ApiError } from "../../../lib/api.js";

import { getClientById } from "../services/client.service.js";

import type {
  IClientDetailsResponse,
  IClientQuotation,
  IClientContract
} from "../types/client.types.js";

function formatDate(
  value: string | null | undefined
): string {
  if (!value) {
    return "Not specified";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatDateTime(
  value: string | null | undefined
): string {
  if (!value) {
    return "Not specified";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatCurrency(amountKobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amountKobo / 100);
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((part) =>
      part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");
}

function getStatusClasses(status: string): string {
  const normalizedStatus = status.toLowerCase();

  if (
    [
      "accepted",
      "approved",
      "completed",
      "converted"
    ].includes(normalizedStatus)
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    [
      "declined",
      "rejected",
      "cancelled",
      "closed",
      "withdrawn"
    ].includes(normalizedStatus)
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    [
      "in_progress",
      "under_review",
      "awaiting_information",
      "revision_requested",
      "issued",
      "sent"
    ].includes(normalizedStatus)
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    [
      "on_hold",
      "expired"
    ].includes(normalizedStatus)
  ) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

function StatusBadge({
  status
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(status)}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  count
}: {
  icon: typeof Users;
  title: string;
  count: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1556D6]">
          <Icon size={19} />
        </div>

        <h2 className="text-lg font-bold text-[#07152F]">
          {title}
        </h2>
      </div>

      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {count} {count === 1 ? "record" : "records"}
      </span>
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
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-700">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function RevisionHistory<T extends {
  version: number;
  createdAt: string;
}>({
  revisions,
  renderRevision
}: {
  revisions: T[];
  renderRevision: (revision: T) => React.ReactNode;
}) {
  if (revisions.length <= 1) {
    return null;
  }

  return (
    <details className="mt-4 border-t border-slate-100 pt-3">
      <summary className="cursor-pointer text-sm font-semibold text-[#1556D6] hover:text-blue-800">
        View revision history ({revisions.length})
      </summary>

      <div className="mt-4 space-y-3">
        {revisions.map((revision) => (
          <div
            key={`${revision.version}-${revision.createdAt}`}
            className="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            {renderRevision(revision)}
          </div>
        ))}
      </div>
    </details>
  );
}

function QuotationRevisionDetails({
  quotation
}: {
  quotation: IClientQuotation;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-[#07152F]">
            Version {quotation.version}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Created {formatDate(quotation.createdAt)}
          </p>
        </div>

        <StatusBadge status={quotation.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField
          label="Service Request"
          value={quotation.serviceRequestReference}
        />

        <DetailField
          label="Subtotal"
          value={formatCurrency(quotation.subtotalKobo)}
        />

        <DetailField
          label="Discount"
          value={formatCurrency(quotation.discountKobo)}
        />

        <DetailField
          label="Total Amount"
          value={formatCurrency(quotation.totalAmountKobo)}
        />

        <DetailField
          label="Valid Until"
          value={formatDate(quotation.validUntil)}
        />

        <DetailField
          label="Issued"
          value={formatDate(quotation.issuedAt)}
        />

        <DetailField
          label="Response Date"
          value={formatDate(quotation.respondedAt)}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Scope
        </p>

        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {quotation.scope}
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Quotation Items
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-white">
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Unit Amount</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {quotation.items.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">
                      {item.serviceName}
                    </p>

                    <p className="mt-1 max-w-sm text-xs text-slate-500">
                      {item.description}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {item.quantity}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {formatCurrency(item.unitAmountKobo)}
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatCurrency(item.totalAmountKobo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {quotation.terms.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Terms
          </p>

          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
            {quotation.terms.map((term, index) => (
              <li key={`${index}-${term}`}>
                {term}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ContractRevisionDetails({
  contract
}: {
  contract: IClientContract;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-[#07152F]">
            Version {contract.version}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Created {formatDate(contract.createdAt)}
          </p>
        </div>

        <StatusBadge status={contract.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField
          label="Contract Title"
          value={contract.title}
        />

        <DetailField
          label="Quotation"
          value={contract.quotationNumber}
        />

        <DetailField
          label="Contract Amount"
          value={formatCurrency(contract.contractAmountKobo)}
        />

        <DetailField
          label="Start Date"
          value={formatDate(contract.startDate)}
        />

        <DetailField
          label="Expected Completion"
          value={formatDate(contract.expectedCompletionDate)}
        />

        <DetailField
          label="Issued Date"
          value={formatDate(contract.issuedAt)}
        />

        <DetailField
          label="Acceptance Deadline"
          value={formatDate(contract.acceptanceDeadline)}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Scope
        </p>

        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {contract.scope}
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Contract Items
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-white">
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Unit Amount</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {contract.items.map((item, index) => (
                <tr key={`${item.serviceName}-${index}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">
                      {item.serviceName}
                    </p>

                    <p className="mt-1 max-w-sm text-xs text-slate-500">
                      {item.description}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {item.quantity}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {formatCurrency(item.unitAmountKobo)}
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatCurrency(item.totalAmountKobo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {contract.deliverables.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Deliverables
          </p>

          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
            {contract.deliverables.map((deliverable, index) => (
              <li key={`${index}-${deliverable}`}>
                {deliverable}
              </li>
            ))}
          </ul>
        </div>
      )}

      {contract.terms.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Terms
          </p>

          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
            {contract.terms.map((term, index) => (
              <li key={`${index}-${term}`}>
                {term}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ClientDetailsPage() {
  const { clientId } = useParams<{
    clientId: string;
  }>();

  const [result, setResult] =
    useState<IClientDetailsResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClient = useCallback(async () => {
    if (!clientId) {
      setError("A valid client ID is required.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await getClientById(clientId);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to retrieve client details. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  if (isLoading && !result) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-[#1556D6]"
          />

          <p className="mt-4 text-sm text-slate-500">
            Loading client details...
          </p>
        </div>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          to="/admin/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#1556D6]"
        >
          <ArrowLeft size={17} />
          Back to Clients
        </Link>

        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load client
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadClient()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const {
    client,
    serviceRequests,
    quotations,
    contracts,
    projects
  } = result;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Breadcrumb and Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            to="/admin/clients"
            className="transition hover:text-[#1556D6]"
          >
            Clients
          </Link>

          <span>/</span>

          <span className="font-medium text-[#1556D6]">
            Client Details
          </span>
        </div>

        <Link
          to="/admin/clients"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Clients
        </Link>
      </div>

      {/* Client Profile */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-[#1556D6]" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-bold text-[#1556D6]">
                {client.fullName
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part.charAt(0).toUpperCase())
                  .join("")}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Client Profile
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#07152F] sm:text-3xl">
                  {client.fullName}
                </h1>

                {client.organisation && (
                  <p className="mt-2 text-sm text-slate-500">
                    {client.organisation}
                  </p>
                )}

                <p className="mt-2 text-xs text-slate-400">
                  Registered {formatDate(client.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <UserRound size={17} />
              Registered Client
            </div>
          </div>

          <div className="mt-8 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Mail size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-400">
                  Email Address
                </p>

                {client.email ? (
                  <a
                    href={`mailto:${client.email}`}
                    className="mt-1 block break-all text-sm font-medium text-[#1556D6] hover:underline"
                  >
                    {client.email}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">
                    Not provided
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Phone size={17} />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Phone Number
                </p>

                <a
                  href={`tel:${client.phone}`}
                  className="mt-1 block text-sm font-medium text-[#1556D6] hover:underline"
                >
                  {client.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <CalendarDays size={17} />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Last Updated
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {formatDateTime(client.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Relationship Summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Service Requests",
            count: serviceRequests.length,
            icon: MessageSquareText
          },
          {
            label: "Quotations",
            count: quotations.length,
            icon: FileText
          },
          {
            label: "Contracts",
            count: contracts.length,
            icon: BriefcaseBusiness
          },
          {
            label: "Projects",
            count: projects.length,
            icon: FolderKanban
          }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {item.label}
                  </p>

                  <p className="mt-2 text-2xl font-bold tabular-nums text-[#07152F]">
                    {item.count}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1556D6]">
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Service Requests */}
      <section className="space-y-4">
        <SectionHeading
          icon={MessageSquareText}
          title="Service Requests"
          count={serviceRequests.length}
        />

        {serviceRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
            <MessageSquareText
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-medium text-slate-700">
              No service requests
            </p>

            <p className="mt-1 text-sm text-slate-500">
              This client has no recorded service requests.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4">
                      Reference
                    </th>

                    <th className="px-6 py-4">
                      Requested Services
                    </th>

                    <th className="px-6 py-4">
                      Submitted
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {serviceRequests.map((request) => (
                    <tr
                      key={request._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#07152F]">
                          {request.reference}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="max-w-sm space-y-1">
                          {request.items.map((item, index) => (
                            <p
                              key={`${item.serviceName}-${index}`}
                              className="text-sm text-slate-700"
                            >
                              {item.serviceName}
                            </p>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(request.submittedAt)}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={request.status} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/admin/requests/${encodeURIComponent(request._id)}`}
                          className="text-sm font-semibold text-[#1556D6] hover:underline"
                        >
                          View request
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Quotations */}
      <section className="space-y-4">
        <SectionHeading
          icon={FileText}
          title="Quotations"
          count={quotations.length}
        />

        {quotations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
            <FileText
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-medium text-slate-700">
              No quotations
            </p>

            <p className="mt-1 text-sm text-slate-500">
              No quotations have been recorded for this client.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {quotations.map((group) => {
              const latest = group.latestVersion;

              return (
                <article
                  key={group.quotationNumber}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Quotation
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-[#07152F]">
                        {group.quotationNumber}
                      </h3>

                      {latest && (
                        <p className="mt-1 text-xs text-slate-500">
                          Latest version: {latest.version}
                        </p>
                      )}
                    </div>

                    {latest && (
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-bold text-[#07152F]">
                          {formatCurrency(latest.totalAmountKobo)}
                        </p>

                        <StatusBadge status={latest.status} />
                      </div>
                    )}
                  </div>

                  {latest ? (
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <QuotationRevisionDetails
                        quotation={latest}
                      />

                      <RevisionHistory
                        revisions={group.revisions}
                        renderRevision={(revision) => (
                          <QuotationRevisionDetails
                            quotation={revision}
                          />
                        )}
                      />
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      No quotation revision details are available.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Contracts */}
      <section className="space-y-4">
        <SectionHeading
          icon={BriefcaseBusiness}
          title="Contracts"
          count={contracts.length}
        />

        {contracts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
            <BriefcaseBusiness
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-medium text-slate-700">
              No contracts
            </p>

            <p className="mt-1 text-sm text-slate-500">
              No contracts have been recorded for this client.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((group) => {
              const latest = group.latestVersion;

              return (
                <article
                  key={group.contractNumber}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Contract
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-[#07152F]">
                        {group.contractNumber}
                      </h3>

                      {latest && (
                        <p className="mt-1 text-xs text-slate-500">
                          Latest version: {latest.version}
                        </p>
                      )}
                    </div>

                    {latest && (
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-bold text-[#07152F]">
                          {formatCurrency(latest.contractAmountKobo)}
                        </p>

                        <StatusBadge status={latest.status} />
                      </div>
                    )}
                  </div>

                  {latest ? (
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <ContractRevisionDetails
                        contract={latest}
                      />

                      <RevisionHistory
                        revisions={group.revisions}
                        renderRevision={(revision) => (
                          <ContractRevisionDetails
                            contract={revision}
                          />
                        )}
                      />
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      No contract revision details are available.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Projects */}
      <section className="space-y-4">
        <SectionHeading
          icon={FolderKanban}
          title="Projects"
          count={projects.length}
        />

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
            <FolderKanban
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-medium text-slate-700">
              No projects
            </p>

            <p className="mt-1 text-sm text-slate-500">
              No projects have been created for this client.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {project.projectReference}
                    </p>

                    <h3 className="mt-1 text-base font-bold text-[#07152F]">
                      {project.title}
                    </h3>
                  </div>

                  <StatusBadge status={project.status} />
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {project.description}
                </p>

                {project.serviceNames.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.serviceNames.map((serviceName) => (
                      <span
                        key={serviceName}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                      >
                        {serviceName}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <DetailField
                    label="Contract Amount"
                    value={
                      project.contractAmountKobo === null
                        ? "Not specified"
                        : formatCurrency(project.contractAmountKobo)
                    }
                  />
                  
                  <DetailField
                    label="Start Date"
                    value={formatDate(project.startDate)}
                  />

                  <DetailField
                    label="Expected Completion"
                    value={formatDate(project.expectedCompletionDate)}
                  />

                  <DetailField
                    label="Completed"
                    value={formatDate(project.completedAt)}
                  />
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <Clock3 size={14} />
                  Created {formatDate(project.createdAt)}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Record Footer */}
      <div className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Client record last updated {formatDateTime(client.updatedAt)}
        </p>

        <p>
          PrimeAce Administration
        </p>
      </div>
    </div>
  );
}

export default ClientDetailsPage;
