import {
  useEffect,
  useState
} from "react";

import type { FormEvent } from "react";
import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  FileText,
  LoaderCircle
} from "lucide-react";

import { ApiError } from "../../../lib/api.js";

import { createContract } from "../services/contract.service.js";

import type {
  ICreateContractInput
} from "../types/contract.types.js";

export default function CreateContractPage() {
  const navigate = useNavigate();

  const [quotationId, setQuotationId] = useState("");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [acceptanceDeadline, setAcceptanceDeadline] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (!startDate || !expectedCompletionDate) {
      setDateError("");
      return;
    }

    if (
      new Date(expectedCompletionDate).getTime() <
      new Date(startDate).getTime()
    ) {
      setDateError(
        "Expected completion date cannot be earlier than the start date."
      );
    } else {
      setDateError("");
    }
  }, [startDate, expectedCompletionDate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!quotationId.trim()) {
      setError("Enter the quotation ID.");
      return;
    }

    if (!title.trim()) {
      setError("Enter a contract title.");
      return;
    }

    if (dateError) {
      return;
    }

    const input: ICreateContractInput = {
      quotationId: quotationId.trim(),
      title: title.trim()
    };

    if (startDate) {
      input.startDate = new Date(`${startDate}T00:00:00`).toISOString();
    }

    if (expectedCompletionDate) {
      input.expectedCompletionDate = new Date(
        `${expectedCompletionDate}T00:00:00`
      ).toISOString();
    }

    if (acceptanceDeadline) {
      input.acceptanceDeadline = new Date(
        `${acceptanceDeadline}T23:59:59`
      ).toISOString();
    }

    try {
      setSubmitting(true);

      const contract = await createContract(input);

      navigate(`/admin/contracts/${contract._id}`, {
        replace: true,
        state: {
          message: "Contract draft created successfully."
        }
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create the contract. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/admin/contracts"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to contracts
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Create contract
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a contract draft from an approved quotation.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="space-y-6 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700">
              <FileText size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Contract information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                The quotation supplies the client, services, pricing and terms.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="quotationId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Approved quotation ID
            </label>

            <input
              id="quotationId"
              type="text"
              value={quotationId}
              onChange={(event) => setQuotationId(event.target.value)}
              placeholder="Enter the quotation ID"
              required
              maxLength={24}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1.5 text-xs text-gray-500">
              Enter the MongoDB ID of the approved quotation.
            </p>
          </div>

          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Contract title
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Statistical Analysis and Research Support"
              required
              maxLength={200}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-lg bg-gray-100 p-2.5 text-gray-700">
                <CalendarDays size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Contract dates
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  These dates can be left blank and updated while the contract is a draft.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="startDate"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Start date
                </label>

                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="expectedCompletionDate"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Expected completion
                </label>

                <input
                  id="expectedCompletionDate"
                  type="date"
                  value={expectedCompletionDate}
                  onChange={(event) =>
                    setExpectedCompletionDate(event.target.value)
                  }
                  min={startDate || undefined}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {dateError && (
              <p className="mt-3 text-sm text-red-600">
                {dateError}
              </p>
            )}

            <div className="mt-5">
              <label
                htmlFor="acceptanceDeadline"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Acceptance deadline
              </label>

              <input
                id="acceptanceDeadline"
                type="date"
                value={acceptanceDeadline}
                onChange={(event) =>
                  setAcceptanceDeadline(event.target.value)
                }
                min={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                The deadline must be in the future when the contract is issued.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Link
            to="/admin/contracts"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting || Boolean(dateError)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <LoaderCircle size={17} className="animate-spin" />
            )}

            {submitting ? "Creating..." : "Create draft"}
          </button>
        </div>
      </form>
    </div>
  );
}