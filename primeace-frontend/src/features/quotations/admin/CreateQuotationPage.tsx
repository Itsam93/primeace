import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import type {
  FormEvent,
  ReactNode
} from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  Plus,
  RefreshCw,
  Trash2
} from "lucide-react";

import { ApiError } from "../../../lib/api.js";

import {
  getServiceRequestById,
  getServiceRequests
} from "../../service-requests/services/serviceRequest.Service.js";

import {
  createQuotation
} from "../services/quotation.service.js";

import type {
  IQuotationCreateInput,
  IQuotationLineItemInput
} from "../types/quotation.types.js";

import type {
  IServiceRequestDetails,
  IServiceRequestListItem
} from "../../service-requests/types/serviceRequest.types.js";

interface IQuotationFormItem {
  serviceRequestItemId: string | null;
  serviceName: string;
  description: string;
  deliverablesText: string;
  quantity: string;
  unitAmount: string;
}

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2
});

function getDefaultValidityDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);

  return date.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function createEmptyItem(): IQuotationFormItem {
  return {
    serviceRequestItemId: null,
    serviceName: "",
    description: "",
    deliverablesText: "",
    quantity: "1",
    unitAmount: ""
  };
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function CreateQuotationPage() {
  const navigate = useNavigate();
  const requestSelectionRef = useRef(0);

  const [serviceRequests, setServiceRequests] =
    useState<IServiceRequestListItem[]>([]);

  const [selectedRequestId, setSelectedRequestId] =
    useState("");

  const [selectedRequest, setSelectedRequest] =
    useState<IServiceRequestDetails | null>(null);

  const [items, setItems] = useState<IQuotationFormItem[]>([
    createEmptyItem()
  ]);

  const [discount, setDiscount] = useState("0");
  const [scope, setScope] = useState("");
  const [termsText, setTermsText] = useState("");
  const [validUntil, setValidUntil] = useState(
    getDefaultValidityDate
  );

  const [isLoadingRequests, setIsLoadingRequests] =
    useState(true);

  const [isLoadingRequestDetails, setIsLoadingRequestDetails] =
    useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const loadServiceRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    setError("");

    try {
      const result = await getServiceRequests({
        page: 1,
        limit: 100,
        sortBy: "submittedAt",
        sortOrder: "desc"
      });

      setServiceRequests(result.requests);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    void loadServiceRequests();
  }, [loadServiceRequests]);

  const handleRequestChange = async (requestId: string) => {
    const selectionId = ++requestSelectionRef.current;

    setSelectedRequestId(requestId);
    setSelectedRequest(null);
    setItems([createEmptyItem()]);
    setFieldError("");
    setError("");

    if (!requestId) {
      setIsLoadingRequestDetails(false);
      return;
    }

    setIsLoadingRequestDetails(true);

    try {
      const request = await getServiceRequestById(requestId);

      if (selectionId !== requestSelectionRef.current) {
        return;
      }

      setSelectedRequest(request);

      if (request.items.length > 0) {
        setItems(
          request.items.map((item) => ({
            serviceRequestItemId: item._id,
            serviceName: item.serviceName,
            description: "",
            deliverablesText: "",
            quantity: "1",
            unitAmount: ""
          }))
        );
      } else {
        setItems([createEmptyItem()]);
      }
    } catch (err) {
      if (selectionId === requestSelectionRef.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (selectionId === requestSelectionRef.current) {
        setIsLoadingRequestDetails(false);
      }
    }
  };

  const updateItem = (
    index: number,
    field: keyof IQuotationFormItem,
    value: string
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const addItem = () => {
    setItems((current) => [...current, createEmptyItem()]);
  };

  const removeItem = (index: number) => {
    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const subtotalKobo = items.reduce((total, item) => {
    const quantity = Number(item.quantity);
    const unitAmount = Number(item.unitAmount);
    const unitAmountKobo = Math.round(unitAmount * 100);

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      !Number.isFinite(unitAmount) ||
      unitAmount < 0 ||
      !Number.isSafeInteger(unitAmountKobo)
    ) {
      return total;
    }

    return total + unitAmountKobo * quantity;
  }, 0);

  const discountValue = Number(discount);
  const discountKobo = Number.isFinite(discountValue)
    ? Math.round(discountValue * 100)
    : 0;

  const totalKobo = Math.max(
    0,
    subtotalKobo - discountKobo
  );

  
const handleSubmit = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  setError("");
  setFieldError("");

  if (!selectedRequestId || !selectedRequest) {
    setFieldError("Select a service request first.");
    return;
  }

  if (isLoadingRequestDetails) {
    setFieldError("Wait for the service request details to finish loading.");
    return;
  }

  if (items.length === 0) {
    setFieldError("Add at least one quotation item.");
    return;
  }

  if (!Number.isSafeInteger(subtotalKobo)) {
    setFieldError("The quotation subtotal exceeds the supported amount.");
    return;
  }

  const preparedItems: IQuotationLineItemInput[] = [];

  for (const [index, item] of items.entries()) {
    const quantity = Number(item.quantity);
    const unitAmount = Number(item.unitAmount);
    const unitAmountKobo = Math.round(unitAmount * 100);

    if (!item.serviceName.trim()) {
      setFieldError(
        `Enter a service name for item ${index + 1}.`
      );
      return;
    }

    if (!item.description.trim()) {
      setFieldError(
        `Enter a description for item ${index + 1}.`
      );
      return;
    }

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 100000
    ) {
      setFieldError(
        `Enter a valid quantity for item ${index + 1}.`
      );
      return;
    }

    if (
      item.unitAmount.trim() === "" ||
      !Number.isFinite(unitAmount) ||
      unitAmount < 0 ||
      !Number.isSafeInteger(unitAmountKobo)
    ) {
      setFieldError(
        `Enter a valid unit amount for item ${index + 1}.`
      );
      return;
    }

    const lineTotalKobo = unitAmountKobo * quantity;

    if (!Number.isSafeInteger(lineTotalKobo)) {
      setFieldError(
        `The amount for item ${index + 1} exceeds the supported limit.`
      );
      return;
    }

    preparedItems.push({
      serviceRequestItemId: item.serviceRequestItemId,
      serviceName: item.serviceName.trim(),
      description: item.description.trim(),
      deliverables: splitLines(item.deliverablesText),
      quantity,
      unitAmountKobo
    });
  }

  const discountInKobo = Math.round(
    Number(discount) * 100
  );

  if (
    discount.trim() === "" ||
    !Number.isFinite(discountValue) ||
    discountValue < 0 ||
    !Number.isSafeInteger(discountInKobo) ||
    discountInKobo > subtotalKobo
  ) {
    setFieldError(
      "Enter a valid discount that does not exceed the subtotal."
    );
    return;
  }

  if (!scope.trim()) {
    setFieldError("Enter the scope of work.");
    return;
  }

  const terms = splitLines(termsText);

  if (!validUntil) {
    setFieldError("Select a quotation validity date.");
    return;
  }

  const validityDate = new Date(
    `${validUntil}T23:59:59.000Z`
  );

  if (
    Number.isNaN(validityDate.getTime()) ||
    validityDate.getTime() <= Date.now()
  ) {
    setFieldError(
      "The validity date must be in the future."
    );
    return;
  }

  const input: IQuotationCreateInput = {
    serviceRequestId: selectedRequestId,
    items: preparedItems,
    discountKobo: discountInKobo,
    scope: scope.trim(),
    terms,
    validUntil: validityDate.toISOString()
  };

  setIsSubmitting(true);

  try {
    const quotation = await createQuotation(input);

    navigate(
      `/admin/quotations/${encodeURIComponent(quotation._id)}`
    );
  } catch (err) {
    setError(getErrorMessage(err));
    setIsSubmitting(false);
  }
};


  return (
    <div className="space-y-7">
      <Link
        to="/admin/quotations"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1556D6]"
      >
        <ArrowLeft size={17} />
        Back to quotations
      </Link>

      <div>
        <p className="text-sm font-medium text-[#1556D6]">
          Quotation management
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#07152F] sm:text-3xl">
          Create quotation
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Prepare a quotation from an existing service request.
        </p>
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

      {fieldError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{fieldError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-[#07152F]">
            Service request
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select the request this quotation will be based on.
          </p>

          <div className="mt-5">
            <label
              htmlFor="service-request"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Service request <span className="text-red-500">*</span>
            </label>

            <select
              id="service-request"
              required
              value={selectedRequestId}
              disabled={isLoadingRequests || isSubmitting}
              onChange={(event) =>
                void handleRequestChange(event.target.value)
              }
              className={inputClassName}
            >
              <option value="">
                {isLoadingRequests
                  ? "Loading service requests..."
                  : "Select a service request"}
              </option>

              {serviceRequests.map((request) => (
                <option
                  key={request._id}
                  value={request._id}
                >
                  {request.reference} — {request.clientSnapshot.fullName}
                </option>
              ))}
            </select>

            {!isLoadingRequests &&
              serviceRequests.length === 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  No service requests are currently available.
                </p>
              )}

            {isLoadingRequestDetails && (
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <RefreshCw
                  size={15}
                  className="animate-spin"
                />
                Loading request details...
              </p>
            )}
          </div>

          {selectedRequest && (
            <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Client
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {selectedRequest.clientSnapshot.fullName}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedRequest.clientSnapshot.email ||
                    selectedRequest.clientSnapshot.phone}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Request reference
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {selectedRequest.reference}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-[#07152F]">
                Quotation items
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Describe the services, deliverables and pricing.
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              disabled={
                isSubmitting ||
                isLoadingRequestDetails ||
                !selectedRequest
              }
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#1556D6] px-3 py-2 text-sm font-semibold text-[#1556D6] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Add item
            </button>
          </div>

          <div className="mt-6 space-y-5">
            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 p-4 sm:p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[#07152F]">
                    Item {index + 1}
                  </h3>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={isSubmitting}
                      aria-label={`Remove item ${index + 1}`}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Service name"
                    required
                  >
                    <input
                      type="text"
                      maxLength={200}
                      required
                      value={item.serviceName}
                      onChange={(event) =>
                        updateItem(
                          index,
                          "serviceName",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Data analysis"
                      disabled={isSubmitting}
                      className={inputClassName}
                    />
                  </FormField>

                  <FormField
                    label="Quantity"
                    required
                  >
                    <input
                      type="number"
                      min="1"
                      max="100000"
                      step="1"
                      required
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(
                          index,
                          "quantity",
                          event.target.value
                        )
                      }
                      disabled={isSubmitting}
                      className={inputClassName}
                    />
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField
                      label="Description"
                      required
                    >
                      <textarea
                        required
                        rows={3}
                        maxLength={5000}
                        value={item.description}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "description",
                            event.target.value
                          )
                        }
                        placeholder="Describe the work covered by this item..."
                        disabled={isSubmitting}
                        className={`${inputClassName} resize-y`}
                      />
                    </FormField>
                  </div>

                  <div className="sm:col-span-2">
                    <FormField label="Deliverables">
                      <textarea
                        rows={3}
                        value={item.deliverablesText}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "deliverablesText",
                            event.target.value
                          )
                        }
                        placeholder="Enter one deliverable per line"
                        disabled={isSubmitting}
                        className={`${inputClassName} resize-y`}
                      />

                      <p className="mt-1.5 text-xs text-slate-400">
                        Each line will be saved as a separate deliverable.
                      </p>
                    </FormField>
                  </div>

                  <FormField
                    label="Unit amount (NGN)"
                    required
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={item.unitAmount}
                      onChange={(event) =>
                        updateItem(
                          index,
                          "unitAmount",
                          event.target.value
                        )
                      }
                      placeholder="0.00"
                      disabled={isSubmitting}
                      className={inputClassName}
                    />
                  </FormField>

                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Line total
                    </p>

                    <div className="flex min-h-[46px] items-center rounded-xl bg-slate-50 px-4 text-sm font-semibold tabular-nums text-[#07152F]">
                      {currencyFormatter.format(
                        (Number(item.unitAmount) || 0) *
                        (Number(item.quantity) || 0)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-[#07152F]">
            Scope and terms
          </h2>

          <div className="mt-5 space-y-5">
            <FormField
              label="Scope of work"
              required
            >
              <textarea
                required
                rows={5}
                maxLength={10000}
                value={scope}
                onChange={(event) => setScope(event.target.value)}
                placeholder="Describe the overall scope of the engagement..."
                disabled={isSubmitting}
                className={`${inputClassName} resize-y`}
              />
            </FormField>

            <FormField label="Terms and conditions">
              <textarea
                rows={5}
                value={termsText}
                onChange={(event) =>
                  setTermsText(event.target.value)
                }
                placeholder={
                  "Enter one term per line, for example:\nPayment is required before work begins.\nThe client must provide all required materials."
                }
                disabled={isSubmitting}
                className={`${inputClassName} resize-y`}
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Each line will be saved as a separate term.
              </p>
            </FormField>

            <FormField
              label="Valid until"
              required
            >
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={validUntil}
                onChange={(event) =>
                  setValidUntil(event.target.value)
                }
                disabled={isSubmitting}
                className={inputClassName}
              />
            </FormField>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-[#07152F]">
            Quotation summary
          </h2>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <FormField label="Discount (NGN)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(event) =>
                  setDiscount(event.target.value)
                }
                disabled={isSubmitting}
                className={inputClassName}
              />
            </FormField>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium tabular-nums text-slate-700">
                  {currencyFormatter.format(subtotalKobo / 100)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="font-medium tabular-nums text-slate-700">
                  {currencyFormatter.format(discountKobo / 100)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="font-semibold text-[#07152F]">
                  Total
                </span>

                <span className="text-xl font-bold tabular-nums text-[#1556D6]">
                  {currencyFormatter.format(totalKobo / 100)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Link
            to="/admin/quotations"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingRequestDetails ||
              !selectedRequest
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1556D6] px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                Creating quotation...
              </>
            ) : (
              "Save quotation draft"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  required = false,
  children
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children}
    </div>
  );
}

export default CreateQuotationPage;
