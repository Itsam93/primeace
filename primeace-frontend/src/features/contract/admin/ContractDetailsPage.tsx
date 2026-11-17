import {
  useCallback,
  useEffect,
  useState
} from "react";

import type { FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Send,
  XCircle
} from "lucide-react";

import { ContractStatus } from "@primeace/shared";

import { ApiError } from "../../../lib/api.js";

import {
  createContractRevision,
  getContractById,
  issueContract,
  updateContract,
  withdrawContract
} from "../services/contract.service.js";

import type {
  IContract,
  IContractAcceptance,
  IContractDetails,
  IUpdateContractInput
} from "../types/contract.types.js";

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
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getDisplayStatus(contract: IContract): ContractStatus {
  if (
    contract.status === ContractStatus.ISSUED &&
    contract.acceptanceDeadline &&
    new Date(contract.acceptanceDeadline).getTime() <= Date.now()
  ) {
    return ContractStatus.EXPIRED;
  }

  return contract.status;
}

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function ContractDetailsPage() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [contract, setContract] = useState<IContract | null>(null);
  const [acceptance, setAcceptance] = useState<IContractAcceptance | null>(null);
  const [revisions, setRevisions] = useState<IContract[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    (location.state as { message?: string } | null)?.message ?? ""
  );

  const [accessUrl, setAccessUrl] = useState("");

  const [title, setTitle] = useState("");
  const [scope, setScope] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [terms, setTerms] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [acceptanceDeadline, setAcceptanceDeadline] = useState("");

  const fetchContract = useCallback(async () => {
    if (!contractId) {
      setError("A contract ID was not provided.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getContractById(contractId);

      // Supports the current backend response (a contract document)
      // and the expanded details response planned for the admin endpoint.
      const details = result as unknown as IContractDetails;
      const currentContract = details.contract ?? result;

      setContract(currentContract);
      setAcceptance(details.contract ? details.acceptance : null);
      setRevisions(details.contract ? details.revisions ?? [] : []);

      setTitle(currentContract.title);
      setScope(currentContract.scope);
      setDeliverables(currentContract.deliverables.join("\n"));
      setTerms(currentContract.terms.join("\n"));

      setStartDate(
        currentContract.startDate
          ? currentContract.startDate.slice(0, 10)
          : ""
      );

      setExpectedCompletionDate(
        currentContract.expectedCompletionDate
          ? currentContract.expectedCompletionDate.slice(0, 10)
          : ""
      );

      setAcceptanceDeadline(
        currentContract.acceptanceDeadline
          ? currentContract.acceptanceDeadline.slice(0, 10)
          : ""
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    void fetchContract();
  }, [fetchContract]);

  const isDraft = contract?.status === ContractStatus.DRAFT;
  const displayStatus = contract ? getDisplayStatus(contract) : null;

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!contractId || !contract) return;

    if (
      startDate &&
      expectedCompletionDate &&
      expectedCompletionDate < startDate
    ) {
      setError("Expected completion date cannot be earlier than the start date.");
      return;
    }

    const input: IUpdateContractInput = {
      title: title.trim(),
      scope: scope.trim(),
      deliverables: deliverables
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      terms: terms
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      startDate: startDate
        ? new Date(`${startDate}T00:00:00`).toISOString()
        : null,
      expectedCompletionDate: expectedCompletionDate
        ? new Date(`${expectedCompletionDate}T00:00:00`).toISOString()
        : null,
      acceptanceDeadline: acceptanceDeadline
        ? new Date(`${acceptanceDeadline}T23:59:59`).toISOString()
        : null
    };

    try {
      setSaving(true);
      setError("");
      setNotice("");

      await updateContract(contractId, input);

      setNotice("Contract draft updated successfully.");
      await fetchContract();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleIssue = async () => {
    if (!contractId || !contract) return;

    if (!acceptanceDeadline) {
      setError("Set an acceptance deadline before issuing this contract.");
      return;
    }

    if (
      new Date(`${acceptanceDeadline}T23:59:59`).getTime() <= Date.now()
    ) {
      setError("The acceptance deadline must be in the future.");
      return;
    }

    const confirmed = window.confirm(
      "Issue this contract? The client will be able to access it using the generated link."
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setNotice("");

      const result = await issueContract(contractId);

      const url = `${window.location.origin}/contract/${encodeURIComponent(
        result.accessToken
      )}`;

      setAccessUrl(url);
      setNotice("Contract issued successfully. Copy the client link below.");

      await fetchContract();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!contractId) return;

    const confirmed = window.confirm(
      "Withdraw this issued contract? Its existing access link will stop working."
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setNotice("");

      await withdrawContract(contractId);

      setNotice("Contract withdrawn successfully.");
      setAccessUrl("");
      await fetchContract();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevision = async () => {
    if (!contractId) return;

    const confirmed = window.confirm(
      "Create a new contract revision? The current version will remain unchanged."
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      const revision = await createContractRevision(contractId);

      navigate(`/admin/contracts/${revision._id}`, {
        replace: true,
        state: {
          message: `Revision ${revision.version} created successfully.`
        }
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!accessUrl) return;

    try {
      await navigator.clipboard.writeText(accessUrl);
      setNotice("Contract link copied.");
    } catch {
      setError("Unable to copy the link. Please copy it manually.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-gray-500">
        <RefreshCw size={18} className="animate-spin" />
        Loading contract...
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-5">
        <Link
          to="/admin/contracts"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to contracts
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error || "Contract not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/admin/contracts"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to contracts
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">
              {contract.contractNumber}
            </h1>

            {displayStatus && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[displayStatus]}`}
              >
                {statusLabels[displayStatus]}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Version {contract.version} · Created {formatDate(contract.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <button
              type="button"
              onClick={handleIssue}
              disabled={actionLoading || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}
              Issue contract
            </button>
          )}

          {contract.status === ContractStatus.ISSUED && (
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle size={17} />
              Withdraw
            </button>
          )}

          {contract.status !== ContractStatus.DRAFT &&
            contract.status !== ContractStatus.WITHDRAWN && (
              <button
                type="button"
                onClick={handleRevision}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RotateCcw size={17} />
                Create revision
              </button>
            )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {notice && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
        </div>
      )}

      {accessUrl && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-900">
            Client contract link
          </h2>

          <p className="mt-1 text-sm text-blue-800">
            This link contains the access token. Share it only with the intended client.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={accessUrl}
              className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-gray-700"
            />

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
            >
              <Copy size={16} />
              Copy link
            </button>

            <a
              href={accessUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-50"
            >
              <ExternalLink size={16} />
              Open
            </a>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <form
            onSubmit={handleSave}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Contract information
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {isDraft
                    ? "You can edit these fields while the contract remains a draft."
                    : "Issued contract content is read-only. Create a revision to make changes."}
                </p>
              </div>

              {isDraft && (
                <FileText size={20} className="text-gray-400" />
              )}
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label
                  htmlFor="contractTitle"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Contract title
                </label>

                <input
                  id="contractTitle"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={!isDraft}
                  required
                  maxLength={200}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label
                  htmlFor="contractScope"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Scope of work
                </label>

                <textarea
                  id="contractScope"
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                  disabled={!isDraft}
                  rows={6}
                  required
                  maxLength={10000}
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              <div>
                <label
                  htmlFor="contractDeliverables"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Deliverables
                </label>

                <textarea
                  id="contractDeliverables"
                  value={deliverables}
                  onChange={(event) => setDeliverables(event.target.value)}
                  disabled={!isDraft}
                  rows={4}
                  placeholder="Enter one deliverable per line"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Enter each deliverable on a separate line.
                </p>
              </div>

              <div>
                <label
                  htmlFor="contractTerms"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Terms and conditions
                </label>

                <textarea
                  id="contractTerms"
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                  disabled={!isDraft}
                  rows={5}
                  placeholder="Enter one term per line"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Enter each term on a separate line.
                </p>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays size={18} className="text-gray-500" />

                  <h3 className="font-medium text-gray-900">
                    Contract dates
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contractStartDate"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Start date
                    </label>

                    <input
                      id="contractStartDate"
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      disabled={!isDraft}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contractCompletionDate"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Expected completion
                    </label>

                    <input
                      id="contractCompletionDate"
                      type="date"
                      value={expectedCompletionDate}
                      onChange={(event) =>
                        setExpectedCompletionDate(event.target.value)
                      }
                      min={startDate || undefined}
                      disabled={!isDraft}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm disabled:bg-gray-50"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="contractAcceptanceDeadline"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Acceptance deadline
                    </label>

                    <input
                      id="contractAcceptanceDeadline"
                      type="date"
                      value={acceptanceDeadline}
                      onChange={(event) =>
                        setAcceptanceDeadline(event.target.value)
                      }
                      disabled={!isDraft}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm disabled:bg-gray-50 sm:max-w-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {isDraft && (
              <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-5 py-4">
                <button
                  type="submit"
                  disabled={saving || actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving && (
                    <LoaderCircle size={17} className="animate-spin" />
                  )}
                  Save changes
                </button>
              </div>
            )}
          </form>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">
                Contract items
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Service</th>
                    <th className="px-5 py-3 font-medium">Quantity</th>
                    <th className="px-5 py-3 font-medium">Unit amount</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {contract.items.map((item, index) => (
                    <tr key={`${item.serviceName}-${index}`}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {item.serviceName}
                        </p>

                        <p className="mt-1 max-w-sm text-xs text-gray-500">
                          {item.description}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {item.quantity}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatCurrency(item.unitAmountKobo)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(item.totalAmountKobo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-5 py-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Contract amount
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {formatCurrency(contract.contractAmountKobo)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Client information
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Full name</p>
                <p className="mt-1 font-medium text-gray-900">
                  {contract.clientSnapshot.fullName}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="mt-1 break-all text-gray-700">
                  {contract.clientSnapshot.email || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="mt-1 text-gray-700">
                  {contract.clientSnapshot.phone}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Related records
            </h2>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Quotation</p>
                <Link
                  to={`/admin/quotations/${contract.quotationId}`}
                  className="mt-1 inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
                >
                  {contract.quotationNumber}
                  <ExternalLink size={13} />
                </Link>
              </div>

              <div>
                <p className="text-xs text-gray-500">Service request</p>
                <Link
                  to={`/admin/service-requests/${contract.serviceRequestId}`}
                  className="mt-1 inline-flex items-center gap-1 break-all font-medium text-blue-700 hover:underline"
                >
                  View service request
                  <ExternalLink size={13} />
                </Link>
              </div>

              {contract.projectId && (
                <div>
                  <p className="text-xs text-gray-500">Project</p>
                  <Link
                    to={`/admin/projects/${contract.projectId}`}
                    className="mt-1 inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
                  >
                    View project
                    <ExternalLink size={13} />
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Contract timeline
            </h2>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="mt-1 text-gray-700">
                  {formatDateTime(contract.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Last updated</p>
                <p className="mt-1 text-gray-700">
                  {formatDateTime(contract.updatedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Issued</p>
                <p className="mt-1 text-gray-700">
                  {formatDateTime(contract.issuedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Acceptance deadline</p>
                <p className="mt-1 text-gray-700">
                  {formatDateTime(contract.acceptanceDeadline)}
                </p>
              </div>
            </div>
          </section>

          {acceptance && (
            <section className="rounded-xl border border-green-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" />
                <h2 className="font-semibold text-gray-900">
                  Acceptance record
                </h2>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Accepted by</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {acceptance.acceptedBy}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Accepted at</p>
                  <p className="mt-1 text-gray-700">
                    {formatDateTime(acceptance.acceptedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Agreement confirmed</p>
                  <p className="mt-1 text-gray-700">
                    {acceptance.agreementConfirmed ? "Yes" : "No"}
                  </p>
                </div>

                {acceptance.acceptedDocumentFileId && (
                  <div>
                    <p className="text-xs text-gray-500">
                      Supporting document
                    </p>
                    <p className="mt-1 break-all text-gray-700">
                      {acceptance.acceptedDocumentFileId}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500">IP address</p>
                  <p className="mt-1 text-gray-700">
                    {acceptance.evidence.ipAddress || "Not recorded"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">User agent</p>
                  <p className="mt-1 break-all text-xs text-gray-600">
                    {acceptance.evidence.userAgent || "Not recorded"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {revisions.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">
                Contract revisions
              </h2>

              <div className="mt-4 space-y-3">
                {revisions.map((revision) => (
                  <Link
                    key={revision._id}
                    to={`/admin/contracts/${revision._id}`}
                    className="block rounded-lg border border-gray-200 p-3 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <p className="font-medium text-gray-900">
                      Version {revision.version}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(revision.createdAt)}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusStyles[getDisplayStatus(revision)]}`}
                    >
                      {statusLabels[getDisplayStatus(revision)]}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}