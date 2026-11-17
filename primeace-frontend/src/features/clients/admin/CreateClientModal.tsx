import { useState } from "react";
import type { FormEvent } from "react";

import {
  AlertCircle,
  LoaderCircle,
  X
} from "lucide-react";

import { ApiError } from "../../../lib/api.js";

import { createClient } from "../services/client.service.js";

interface CreateClientModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateClientModal({
  onClose,
  onCreated
}: CreateClientModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organisation, setOrganisation] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!fullName.trim() || !phone.trim()) {
      setError("Full name and phone number are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createClient({
        fullName: fullName.trim(),
        phone: phone.trim(),
        ...(email.trim()
          ? { email: email.trim() }
          : {}),
        ...(organisation.trim()
          ? { organisation: organisation.trim() }
          : {})
      });

      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create client. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1556D6] focus:ring-2 focus:ring-blue-100";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-client-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2
              id="create-client-title"
              className="text-lg font-bold text-[#07152F]"
            >
              Add New Client
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the client's contact information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="client-full-name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full Name <span className="text-red-500">*</span>
              </label>

              <input
                id="client-full-name"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="Enter client's full name"
                maxLength={100}
                required
                autoFocus
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="client-phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>

              <input
                id="client-phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Enter phone number"
                maxLength={20}
                required
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="client-email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email Address
              </label>

              <input
                id="client-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter email address (optional)"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="client-organisation"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Organisation
              </label>

              <input
                id="client-organisation"
                type="text"
                value={organisation}
                onChange={(event) =>
                  setOrganisation(event.target.value)
                }
                placeholder="Enter organisation (optional)"
                maxLength={150}
                className={inputClassName}
              />
            </div>

            <p className="text-xs text-slate-500">
              Fields marked with an asterisk are required.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1556D6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              )}

              {isSubmitting ? "Creating..." : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateClientModal;
