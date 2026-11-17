import type {
  IService,
  IServiceRequestContact
} from "../../services/types/service.type.js";

interface ReviewStepProps {
  services: IService[];
  contact: IServiceRequestContact;
  answers: Record<string, Record<string, unknown>>;
}

function ReviewStep({
  services,
  contact,
  answers
}: ReviewStepProps) {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-[#07152F]">
          Contact information
        </h3>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Full name</dt>
            <dd className="mt-1 font-medium text-[#07152F]">
              {contact.fullName}
            </dd>
          </div>

          <div>
            <dt className="text-slate-500">Phone</dt>
            <dd className="mt-1 font-medium text-[#07152F]">
              {contact.phone}
            </dd>
          </div>

          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="mt-1 font-medium text-[#07152F]">
              {contact.email || "Not provided"}
            </dd>
          </div>

          <div>
            <dt className="text-slate-500">Organisation</dt>
            <dd className="mt-1 font-medium text-[#07152F]">
              {contact.organisation || "Not provided"}
            </dd>
          </div>
        </dl>
      </section>

      {services.map((service) => (
        <section
          key={service._id}
          className="rounded-2xl border border-slate-200 p-6"
        >
          <h3 className="font-semibold text-[#07152F]">
            {service.name}
          </h3>

          <dl className="mt-5 space-y-4 text-sm">
            {Object.entries(answers[service._id] ?? {}).map(
              ([key, value]) => (
                <div key={key}>
                  <dt className="text-slate-500">{key}</dt>
                  <dd className="mt-1 font-medium text-[#07152F]">
                    {Array.isArray(value)
                      ? value.join(", ")
                      : typeof value === "boolean"
                        ? value ? "Yes" : "No"
                        : String(value ?? "Not provided")}
                  </dd>
                </div>
              )
            )}
          </dl>
        </section>
      ))}
    </div>
  );
}

export default ReviewStep;