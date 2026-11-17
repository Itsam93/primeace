import {
  useCallback,
  useEffect,
  useState
} from "react";

import type { FormEvent } from "react";
import { useParams } from "react-router-dom";

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  ShieldCheck,
  XCircle
} from "lucide-react";

import { ContractStatus } from "@primeace/shared";

import { ApiError } from "../../../lib/api.js";

import {
  getPublicContract,
  respondToPublicContract
} from "../services/contract.service.js";

import type {
  IContract,
  IContractClientResponseInput
} from "../types/contract.types.js";

function formatCurrency(amountKobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2
  }).format(amountKobo / 100);
}

function formatDate(value: string | null): string {
  if (!value) return "Not specified";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not specified";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function PublicContractPage() {
  const { token } = useParams<{ token: string }>();

  const [contract, setContract] = useState<IContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  const [acceptedBy, setAcceptedBy] = useState("");
  const [agreementConfirmed, setAgreementConfirmed] = useState(false);

  const [decision, setDecision] = useState<"accepted" | "rejected" | null>(
    null
  );

  const fetchContract = useCallback(async () => {
    if (!token) {
      setError("The contract link is invalid.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getPublicContract(token);
      setContract(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchContract();
  }, [fetchContract]);

  const isIssued = contract?.status === ContractStatus.ISSUED;

  const handleResponse = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!token || !contract || !isIssued || !decision) return;

    if (
      decision === "accepted" &&
      (!acceptedBy.trim() || !agreementConfirmed)
    ) {
      setError(
        "Enter your full name and confirm that you agree to the contract."
      );
      return;
    }

    const input: IContractClientResponseInput =
      decision === "accepted"
        ? {
            response: "accepted",
            acceptedBy: acceptedBy.trim(),
            agreementConfirmed: true
          }
        : {
            response: "rejected"
          };

    const confirmation = decision === "accepted"
      ? "By continuing, you confirm your acceptance of this contract."
      : "Are you sure you want to reject this contract?";

    if (!window.confirm(confirmation)) return;

    try {
      setSubmitting(true);
      setError("");
      setResponseMessage("");

      await respondToPublicContract(token, input);

      if (decision === "accepted") {
        setResponseMessage(
          "Your acceptance has been recorded successfully. The project will now be created or updated."
        );
      } else {
        setResponseMessage(
          "Your decision to reject this contract has been recorded."
        );
      }

      await fetchContract();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <LoaderCircle size={20} className="animate-spin" />
          Loading your contract...
        </div>
      </main>
    );
  }

  if (!contract) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle size={28} className="text-red-600" />
          </div>

          <h1 className="text-xl font-semibold text-gray-900">
            Contract unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            {error || "This contract link is invalid or no longer available."}
          </p>

          <p className="mt-5 text-xs text-gray-400">
            Please contact PrimeAce if you need assistance.
          </p>
        </div>
      </main>
    );
  }

  const isAccepted = contract.status === ContractStatus.ACCEPTED;
  const isRejected = contract.status === ContractStatus.REJECTED;
  const isWithdrawn = contract.status === ContractStatus.WITHDRAWN;

  const deadlinePassed = Boolean(
    contract.acceptanceDeadline &&
    new Date(contract.acceptanceDeadline).getTime() <= Date.now()
  );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <FileText size={24} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            PrimeAce
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Contract review and acceptance
          </p>
        </header>

        {responseMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <p>{responseMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Service agreement
                </p>

                <h2 className="mt-2 text-xl font-semibold text-gray-900 sm:text-2xl">
                  {contract.title}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {contract.contractNumber} · Version {contract.version}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  isAccepted
                    ? "bg-green-100 text-green-700"
                    : isRejected
                      ? "bg-red-100 text-red-700"
                      : isWithdrawn
                        ? "bg-gray-100 text-gray-700"
                        : deadlinePassed
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                }`}
              >
                {isAccepted
                  ? "Accepted"
                  : isRejected
                    ? "Rejected"
                    : isWithdrawn
                      ? "Withdrawn"
                      : deadlinePassed
                        ? "Deadline passed"
                        : "Awaiting response"}
              </span>
            </div>
          </div>

          <div className="space-y-8 px-5 py-7 sm:px-8">
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Prepared for
              </h3>

              <div className="mt-3 rounded-xl bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">
                  {contract.clientSnapshot.fullName}
                </p>

                {contract.clientSnapshot.email && (
                  <p className="mt-1 text-sm text-gray-600">
                    {contract.clientSnapshot.email}
                  </p>
                )}

                <p className="mt-1 text-sm text-gray-600">
                  {contract.clientSnapshot.phone}
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900">
                Scope of work
              </h3>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {contract.scope}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900">
                Services and fees
              </h3>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[550px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                      <th className="py-3 pr-4 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Quantity</th>
                      <th className="px-4 py-3 font-medium">Unit amount</th>
                      <th className="py-3 pl-4 text-right font-medium">Total</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {contract.items.map((item, index) => (
                      <tr key={`${item.serviceName}-${index}`}>
                        <td className="py-4 pr-4">
                          <p className="font-medium text-gray-900">
                            {item.serviceName}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            {item.description}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-gray-600">
                          {item.quantity}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                          {formatCurrency(item.unitAmountKobo)}
                        </td>

                        <td className="whitespace-nowrap py-4 pl-4 text-right font-medium text-gray-900">
                          {formatCurrency(item.totalAmountKobo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end rounded-xl bg-gray-50 p-4">
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total contract amount
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {formatCurrency(contract.contractAmountKobo)}
                  </p>
                </div>
              </div>
            </section>

            {contract.deliverables.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900">
                  Deliverables
                </h3>

                <ul className="mt-3 space-y-2">
                  {contract.deliverables.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-start gap-3 text-sm leading-6 text-gray-700"
                    >
                      <CheckCircle2
                        size={17}
                        className="mt-1 shrink-0 text-blue-600"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h3 className="text-lg font-semibold text-gray-900">
                Contract terms and conditions
              </h3>

              <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-7 text-gray-700">
                {contract.terms.map((term, index) => (
                  <li key={`${term}-${index}`}>
                    {term}
                  </li>
                ))}
              </ol>
            </section>

            <section className="grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Start date
                </p>

                <p className="mt-2 text-sm font-medium text-gray-900">
                  {formatDate(contract.startDate)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Expected completion
                </p>

                <p className="mt-2 text-sm font-medium text-gray-900">
                  {formatDate(contract.expectedCompletionDate)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Response deadline
                </p>

                <p className="mt-2 text-sm font-medium text-gray-900">
                  {formatDateTime(contract.acceptanceDeadline)}
                </p>
              </div>
            </section>

            {isIssued && !deadlinePassed && (
              <section className="border-t border-gray-200 pt-7">
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-blue-700" />

                    <h3 className="text-lg font-semibold text-gray-900">
                      Your response
                    </h3>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Please review the entire agreement before responding.
                    Acceptance confirms that you agree to the scope, fees,
                    deliverables and terms stated above.
                  </p>
                </div>

                <form onSubmit={handleResponse} className="space-y-5">
                  <div>
                    <label
                      htmlFor="acceptedBy"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Your full name
                    </label>

                    <input
                      id="acceptedBy"
                      type="text"
                      value={acceptedBy}
                      onChange={(event) => setAcceptedBy(event.target.value)}
                      maxLength={200}
                      placeholder="Enter your full name"
                      disabled={submitting}
                      className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                    />
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4">
                    <input
                      type="checkbox"
                      checked={agreementConfirmed}
                      onChange={(event) =>
                        setAgreementConfirmed(event.target.checked)
                      }
                      disabled={submitting}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    <span className="text-sm leading-6 text-gray-700">
                      I have read and understood this contract. I agree to
                      its scope of work, fees, deliverables, dates and terms
                      and conditions.
                    </span>
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      onClick={() => setDecision("accepted")}
                      disabled={
                        submitting ||
                        !acceptedBy.trim() ||
                        !agreementConfirmed
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting && decision === "accepted" ? (
                        <LoaderCircle size={18} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                      Accept contract
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDecision("rejected");
                        const form = document.getElementById(
                          "contract-response-form"
                        ) as HTMLFormElement | null;

                        if (form) {
                          form.requestSubmit();
                        }
                      }}
                      disabled={submitting}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {submitting && decision === "rejected" ? (
                        <LoaderCircle size={18} className="animate-spin" />
                      ) : (
                        <XCircle size={18} />
                      )}
                      Reject contract
                    </button>
                  </div>
                </form>
              </section>
            )}

            {isAccepted && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 size={20} />
                  <h3 className="font-semibold">
                    Contract accepted
                  </h3>
                </div>

                <p className="mt-2 text-sm leading-6 text-green-700">
                  Your acceptance has been recorded. Thank you for choosing
                  PrimeAce.
                </p>
              </div>
            )}

            {isRejected && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle size={20} />
                  <h3 className="font-semibold">
                    Contract rejected
                  </h3>
                </div>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  Your decision has been recorded. Please contact PrimeAce
                  if you would like to discuss the agreement.
                </p>
              </div>
            )}

            {isWithdrawn && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="font-semibold text-gray-900">
                  Contract withdrawn
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  This contract has been withdrawn and can no longer be
                  accepted.
                </p>
              </div>
            )}

            {!isIssued &&
              !isAccepted &&
              !isRejected &&
              !isWithdrawn && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="font-semibold text-amber-900">
                    Contract not available for response
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    This contract is not currently open for acceptance.
                  </p>
                </div>
              )}

            {isIssued && deadlinePassed && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="font-semibold text-amber-900">
                  Acceptance deadline passed
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  The response deadline for this contract has passed.
                  Please contact PrimeAce for assistance.
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-6 text-center text-xs leading-6 text-gray-400">
          <p>PrimeAce</p>
          <p>Thank you for considering our services.</p>
        </footer>
      </div>
    </main>
  );
}