import type { IService } from "../../services/types/service.type.js";
import type { IServiceFormResponse } from "../../services/types/service.type.js";

import DynamicServiceForm from "./DynamicServiceForm.js";

interface ServiceDetailsStepProps {
  services: IService[];
  forms: Record<string, IServiceFormResponse>;
  answers: Record<string, Record<string, unknown>>;
  onChange: (
    serviceId: string,
    answers: Record<string, unknown>
  ) => void;
}

function ServiceDetailsStep({
  services,
  forms,
  answers,
  onChange
}: ServiceDetailsStepProps) {
  return (
    <div className="space-y-10">
      {services.map((service) => {
        const form = forms[service._id];

        return (
          <section
            key={service._id}
            className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8"
          >
            <div className="mb-7 border-b border-slate-100 pb-5">
              <h3 className="text-lg font-semibold text-[#07152F]">
                {service.name}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Please provide the information required for this service.
              </p>
            </div>

            {form ? (
              <DynamicServiceForm
                fields={form.fields}
                answers={answers[service._id] ?? {}}
                onChange={(nextAnswers) =>
                  onChange(service._id, nextAnswers)
                }
              />
            ) : (
              <p className="text-sm text-red-600">
                The form for this service could not be loaded.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default ServiceDetailsStep;