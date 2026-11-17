import { CheckCircle2, Mail } from "lucide-react";

import type {
  IPublicServiceRequestConfirmation
} from "../../services/types/service.type.js";

interface RequestConfirmationProps {
  confirmation: IPublicServiceRequestConfirmation;
}

function RequestConfirmation({
  confirmation
}: RequestConfirmationProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12">
      <CheckCircle2
        size={56}
        className="mx-auto text-green-600"
      />

      <h2 className="mt-6 text-2xl font-semibold text-[#07152F]">
        Your request has been received
      </h2>

      <p className="mt-3 text-sm leading-7 text-slate-500">
        Thank you for contacting PrimeAce. Your request has been
        submitted successfully. Our team will review the details
        and get back to you.
      </p>

      <div className="mt-8 rounded-2xl bg-blue-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Your request reference
        </p>

        <p className="mt-2 text-2xl font-bold tracking-wider text-[#1556D6]">
          {confirmation.reference}
        </p>

        <p className="mt-3 text-xs text-slate-500">
          Please keep this reference for future correspondence.
        </p>
      </div>

      <div className="mt-7 rounded-2xl border border-slate-200 p-5 text-left">
        <div className="flex items-start gap-3">
          <Mail size={20} className="mt-1 shrink-0 text-[#1556D6]" />

          <div>
            <h3 className="text-sm font-semibold text-[#07152F]">
              Supporting documents
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              If your service requires supporting documents,
              email them to{" "}
              <a
                href={`mailto:${confirmation.supportingDocumentsEmail}`}
                className="font-medium text-[#1556D6] underline"
              >
                {confirmation.supportingDocumentsEmail}
              </a>
              {" "}and include your request reference in the email subject.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequestConfirmation;