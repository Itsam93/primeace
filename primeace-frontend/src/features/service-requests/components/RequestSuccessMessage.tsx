import { Check, CheckCircle2, X } from "lucide-react";

import type { IPublicServiceRequestConfirmation } from "../../services/types/service.type.js";

interface RequestSuccessMessageProps {
  confirmation: IPublicServiceRequestConfirmation;
  onDismiss: () => void;
}

function RequestSuccessMessage({
  confirmation,
  onDismiss,
}: RequestSuccessMessageProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={23} />
          </div>

          <div className="min-w-0 flex-1 pr-7">
            <p className="text-base font-semibold text-[#07152F]">
              Your request has been submitted.
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Thank you for contacting PrimeAce. We have received your
              request and will review the details. Our team will get
              back to you shortly.
            </p>

            <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Request reference
                </p>

                <p className="mt-1 font-semibold tracking-wide text-[#07152F]">
                  {confirmation.reference}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Supporting documents
                </p>

                <a
                  href={`mailto:${confirmation.supportingDocumentsEmail}`}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 transition hover:text-blue-900 hover:underline"
                >
                  {confirmation.supportingDocumentsEmail}
                  <Check size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss success message"
          title="Dismiss message"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export default RequestSuccessMessage;