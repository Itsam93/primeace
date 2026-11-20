import ServiceCard from "./ServiceCard";
import { services } from "../data/services";

function Services() {
  return (
    <section
      id="services"
      className="bg-[#07152F] py-24 text-white sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section introduction */}
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            What We Do
          </p>

          <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Practical expertise.
            <span className="block text-blue-400">
              Solutions that deliver.
            </span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            We bring together research, data, business intelligence and
            technology to help individuals and organisations solve problems
            and move their work forward.
          </p>
        </div>

        {/* Services grid */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {services.map((service, index) => (
            <div
              key={service.number}
              className={
                index < 2
                  ? "lg:col-span-3"
                  : "lg:col-span-2"
              }
            >
              <ServiceCard service={service} />
            </div>
          ))}
        </div>

        {/* Closing note */}
        <div className="mt-14 flex flex-col justify-between gap-5 border-t border-white/15 pt-8 sm:flex-row sm:items-center">
          <p className="max-w-xl text-sm leading-7 text-slate-400">
            Not sure which service fits your needs? Tell us what you are
            working on and we will help you determine the right approach.
          </p>

          <a
            href="#contact"
            className="inline-flex w-fit items-center gap-3 text-sm font-semibold text-white transition-colors hover:text-blue-400"
          >
            Talk to our team
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default Services;
