import {
  useCallback,
  useEffect,
  useState
} from "react";

import type { FormEvent } from "react";

import { QuotationStatus } from "@primeace/shared";

import {
  Link,
  useParams
} from "react-router-dom";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  MessageSquareText,
  ShieldCheck
} from "lucide-react";

import { ApiError } from "../../lib/api.js";

import {
  getPublicQuotation,
  respondToQuotation
} from "./services/quotation.service.js";

import type {
  IQuotation,
  IQuotationResponse
} from "./types/quotation.types.js";

type ClientResponse = IQuotationResponse["response"];

const responseStatusMap = {
  approved: QuotationStatus.APPROVED,
  declined: QuotationStatus.DECLINED,
  revision_requested: QuotationStatus.REVISION_REQUESTED
} as const;

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

const statusLabels: Record<QuotationStatus, string> = {
  [QuotationStatus.DRAFT]: "Draft",
  [QuotationStatus.SENT]: "Awaiting response",
  [QuotationStatus.APPROVED]: "Approved",
  [QuotationStatus.DECLINED]: "Declined",
  [QuotationStatus.REVISION_REQUESTED]: "Revision requested",
  [QuotationStatus.EXPIRED]: "Expired",
  [QuotationStatus.WITHDRAWN]: "Withdrawn"
};

function formatCurrency(amountKobo: number): string {
  return currencyFormatter.format(amountKobo / 100);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return dateFormatter.format(date);
}

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function isQuotationActionable(quotation: IQuotation): boolean {
  return (
    quotation.status === QuotationStatus.SENT &&
    new Date(quotation.validUntil).getTime() > Date.now()
  );
}

function getResponseLabel(response: ClientResponse): string {
  switch (response) {
    case "approved":
      return "Approve quotation";

    case "declined":
      return "Decline quotation";

    case "revision_requested":
      return "Request revision";
  }
}

function PublicQuotationPage() {
  const { token } = useParams<{ token: string }>();

  const [quotation, setQuotation] =
    useState<IQuotation | null>(null);

  const [selectedResponse, setSelectedResponse] =
    useState<ClientResponse | "">("");

  const [comments, setComments] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadQuotation = useCallback(async () => {
    if (!token) {
      setError("This quotation link is invalid.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await getPublicQuotation(token);
      setQuotation(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadQuotation();
  }, [loadQuotation]);

  const handleResponse = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!token || !quotation) {
      setError("The quotation could not be loaded.");
      return;
    }

    if (!selectedResponse) {
      setError("Select how you would like to respond.");
      return;
    }

    if (
      selectedResponse === "revision_requested" &&
      !comments.trim()
    ) {
      setError("Please explain the changes you would like made.");
      return;
    }

    if (comments.trim().length > 3000) {
      setError("Your comments must not exceed 3,000 characters.");
      return;
    }

    const response: IQuotationResponse = {
      response: selectedResponse,
      ...(comments.trim()
        ? { comments: comments.trim() }
        : {})
    };

    setIsSubmitting(true);

    try {
      await respondToQuotation(token, response);

      const messages: Record<ClientResponse, string> = {
        approved: "You have successfully approved this quotation.",
        declined: "Your decision to decline this quotation has been submitted.",
        revision_requested: "Your revision request has been submitted."
      };

      setSuccessMessage(messages[selectedResponse]);

      setQuotation((current) =>
        current
          ? {
              ...current,
              status: responseStatusMap[selectedResponse]
            }
          : current
      );

      setSelectedResponse("");
      setComments("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center text-center">
          <LoaderCircle
            size={32}
            className="animate-spin text-[#1556D6]"
          />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading your quotation...
          </p>
        </div>
      </main>
    );
  }

  if (!quotation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle size={26} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-[#07152F]">
            Quotation unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || "This quotation could not be found."}
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1556D6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Return to homepage
          </Link>
        </div>
      </main>
    );
  }

  const actionable = isQuotationActionable(quotation);
  const statusLabel = statusLabels[quotation.status];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-[#07152F]"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#07152F] text-sm font-bold text-white">
              PA
            </span>
            PrimeAce
          </Link>

          <p className="mt-5 text-sm font-medium text-[#1556D6]">
            Client quotation
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#07152F] sm:text-3xl">
            Review your quotation
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Review the services, pricing and terms below.
            You can submit your decision using this page.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />
            <p>{successMessage}</p>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quotation number
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#07152F]">
                  {quotation.quotationNumber}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Version {quotation.version}
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1556D6]">
                <span className="size-1.5 rounded-full bg-current" />
                {statusLabel}
              </span>
            </div>

            <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Prepared for
                </p>

                <p className="mt-1.5 text-sm font-semibold text-slate-800">
                  {quotation.clientSnapshot.fullName}
                </p>

                {quotation.clientSnapshot.email && (
                  <p className="mt-1 text-sm text-slate-500">
                    {quotation.clientSnapshot.email}
                  </p>
                )}

                <p className="mt-1 text-sm text-slate-500">
                  {quotation.clientSnapshot.phone}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Service request
                </p>

                <p className="mt-1.5 text-sm font-semibold text-slate-800">
                  {quotation.serviceRequestReference}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Valid until {formatDate(quotation.validUntil)}
                </p>
              </div>
            </div>
          </div>

          <section className="p-5 sm:p-7">
            <div className="flex items-center gap-2">
              <FileText
                size={18}
                className="text-[#1556D6]"
              />

              <h2 className="font-semibold text-[#07152F]">
                Services and pricing
              </h2>
            </div>

            <div className="mt-5 space-y-5">
              {quotation.items.map((item, index) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-slate-200 p-4 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Item {index + 1}
                      </p>

                      <h3 className="mt-1 font-semibold text-[#07152F]">
                        {item.serviceName}
                      </h3>
                    </div>

                    <p className="text-sm font-semibold tabular-nums text-[#07152F]">
                      {formatCurrency(item.totalAmountKobo)}
                    </p>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>

                  {item.deliverables.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Deliverables
                      </p>

                      <ul className="mt-2 space-y-2">
                        {item.deliverables.map((deliverable, deliverableIndex) => (
                          <li
                            key={`${item._id}-${deliverableIndex}`}
                            className="flex items-start gap-2 text-sm text-slate-600"
                          >
                            <CheckCircle2
                              size={15}
                              className="mt-0.5 shrink-0 text-[#1556D6]"
                            />
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>
                      Quantity: {item.quantity}
                    </span>

                    <span>
                      Unit amount: {formatCurrency(item.unitAmountKobo)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="ml-auto mt-6 w-full max-w-sm space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>

                <span className="font-medium tabular-nums text-slate-700">
                  {formatCurrency(quotation.subtotalKobo)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Discount</span>

                <span className="font-medium tabular-nums text-slate-700">
                  {formatCurrency(quotation.discountKobo)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="font-semibold text-[#07152F]">
                  Total amount
                </span>

                <span className="text-xl font-bold tabular-nums text-[#1556D6]">
                  {formatCurrency(quotation.totalAmountKobo)}
                </span>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 p-5 sm:p-7">
            <h2 className="font-semibold text-[#07152F]">
              Scope of work
            </h2>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {quotation.scope}
            </p>
          </section>

          {quotation.terms.length > 0 && (
            <section className="border-t border-slate-200 p-5 sm:p-7">
              <h2 className="font-semibold text-[#07152F]">
                Terms and conditions
              </h2>

              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
                {quotation.terms.map((term, index) => (
                  <li key={index}>{term}</li>
                ))}
              </ol>
            </section>
          )}

          <section className="border-t border-slate-200 bg-slate-50 p-5 sm:p-7">
            {actionable ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#1556D6]">
                    <MessageSquareText size={19} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-[#07152F]">
                      Your response
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Select one of the options below to submit
                      your decision on this quotation.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleResponse}
                  className="mt-6 space-y-5"
                >
                  <fieldset disabled={isSubmitting}>
                    <legend className="mb-3 text-sm font-medium text-slate-700">
                      How would you like to proceed?
                    </legend>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <ResponseOption
                        value="approved"
                        selected={selectedResponse}
                        onSelect={setSelectedResponse}
                        title="Approve"
                        description="Accept this quotation."
                      />

                      <ResponseOption
                        value="revision_requested"
                        selected={selectedResponse}
                        onSelect={setSelectedResponse}
                        title="Request revision"
                        description="Ask for changes."
                      />

                      <ResponseOption
                        value="declined"
                        selected={selectedResponse}
                        onSelect={setSelectedResponse}
                        title="Decline"
                        description="Do not proceed."
                      />
                    </div>
                  </fieldset>

                  {selectedResponse && (
                    <div>
                      <label
                        htmlFor="quotation-comments"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Comments
                        {selectedResponse === "revision_requested" && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                        {selectedResponse !== "revision_requested" && (
                          <span className="ml-1 font-normal text-slate-400">
                            (Optional)
                          </span>
                        )}
                      </label>

                      <textarea
                        id="quotation-comments"
                        rows={4}
                        maxLength={3000}
                        required={selectedResponse === "revision_requested"}
                        value={comments}
                        onChange={(event) =>
                          setComments(event.target.value)
                        }
                        placeholder={
                          selectedResponse === "revision_requested"
                            ? "Explain the changes you would like made..."
                            : "Add a comment if necessary..."
                        }
                        disabled={isSubmitting}
                        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                      />

                      <p className="mt-1.5 text-right text-xs text-slate-400">
                        {comments.length}/3,000 characters
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !selectedResponse ||
                      (
                        selectedResponse === "revision_requested" &&
                        !comments.trim()
                      )
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1556D6] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                        Submitting response...
                      </>
                    ) : (
                      selectedResponse
                        ? getResponseLabel(selectedResponse)
                        : "Select a response"
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                  {quotation.status === QuotationStatus.APPROVED ? (
                    <CheckCircle2 size={19} />
                  ) : quotation.status === QuotationStatus.EXPIRED ? (
                    <Clock3 size={19} />
                  ) : (
                    <ShieldCheck size={19} />
                  )}
                </div>

                <div>
                  <h2 className="font-semibold text-[#07152F]">
                    {quotation.status === QuotationStatus.APPROVED
                      ? "Quotation approved"
                      : quotation.status === QuotationStatus.DECLINED
                        ? "Quotation declined"
                        : quotation.status === QuotationStatus.REVISION_REQUESTED
                          ? "Revision requested"
                          : quotation.status === QuotationStatus.EXPIRED
                            ? "Quotation expired"
                            : quotation.status === QuotationStatus.WITHDRAWN
                              ? "Quotation withdrawn"
                              : "Response unavailable"}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {quotation.status === QuotationStatus.APPROVED
                      ? "This quotation has already been approved. No further response is required."
                      : quotation.status === QuotationStatus.DECLINED
                        ? "A response has already been submitted for this quotation."
                        : quotation.status === QuotationStatus.REVISION_REQUESTED
                          ? "A revision has already been requested for this quotation."
                          : quotation.status === QuotationStatus.EXPIRED
                            ? "The validity period for this quotation has ended."
                            : quotation.status === QuotationStatus.WITHDRAWN
                              ? "This quotation is no longer available for acceptance."
                              : "This quotation is not currently accepting responses."}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-8 text-center">
          <p className="text-xs leading-5 text-slate-400">
            This quotation was prepared by PrimeAce.
            If you have questions, contact us through our website.
          </p>

          <Link
            to="/"
            className="mt-3 inline-block text-sm font-medium text-[#1556D6] hover:underline"
          >
            Visit PrimeAce
          </Link>
        </footer>
      </div>
    </main>
  );
}

function ResponseOption({
  value,
  selected,
  onSelect,
  title,
  description
}: {
  value: ClientResponse;
  selected: ClientResponse | "";
  onSelect: (value: ClientResponse) => void;
  title: string;
  description: string;
}) {
  const isSelected = selected === value;

  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
        isSelected
          ? "border-[#1556D6] bg-blue-50 ring-1 ring-[#1556D6]"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <input
        type="radio"
        name="quotation-response"
        value={value}
        checked={isSelected}
        onChange={() => onSelect(value)}
        className="mt-1 size-4 accent-[#1556D6]"
      />

      <span>
        <span className="block text-sm font-semibold text-[#07152F]">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

export default PublicQuotationPage;
