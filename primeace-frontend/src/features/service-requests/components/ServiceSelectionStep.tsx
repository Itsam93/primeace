import { Check } from "lucide-react";

import type {
  IService,
  IServiceCategory
} from "../../services/types/service.type.js";

interface ServiceSelectionStepProps {
  categories: IServiceCategory[];
  selectedServices: IService[];
  onToggle: (service: IService) => void;
}

function ServiceSelectionStep({
  categories,
  selectedServices,
  onToggle
}: ServiceSelectionStepProps) {
  const isSelected = (serviceId: string) =>
    selectedServices.some((service) => service._id === serviceId);

  return (
    <div className="space-y-10">
      {categories.map((category) => (
        <section key={category._id}>
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-[#07152F]">
              {category.name}
            </h3>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              {category.description}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {category.services.map((service) => {
              const selected = isSelected(service._id);

              return (
                <button
                  key={service._id}
                  type="button"
                  onClick={() => onToggle(service)}
                  aria-pressed={selected}
                  className={`rounded-2xl border p-5 text-left transition-all ${
                    selected
                      ? "border-[#1556D6] bg-blue-50/70"
                      : "border-slate-200 bg-white hover:border-[#1556D6]/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-semibold text-[#07152F]">
                      {service.name}
                    </h4>

                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-[#1556D6] bg-[#1556D6] text-white"
                          : "border-slate-300 text-transparent"
                      }`}
                    >
                      <Check size={14} />
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {service.shortDescription}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default ServiceSelectionStep;