import type { Service } from "../data/services";

interface ServiceCardProps {
  service: Service;
}

function ServiceCard({ service }: ServiceCardProps) {
  const Icon = service.icon;

  return (
    <article className="group flex h-full min-h-[390px] flex-col border border-white/15 bg-[#0B1D3B] p-7 transition-colors duration-200 hover:border-blue-400/60 sm:p-8">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center border border-blue-400/30 bg-blue-400/10 text-blue-300">
          <Icon size={23} strokeWidth={1.7} />
        </div>

        <span className="text-sm font-medium tracking-widest text-slate-500">
          {service.number}
        </span>
      </div>

      {/* Service information */}
      <div className="mt-9">
        <h3 className="max-w-md text-2xl font-semibold leading-snug tracking-tight text-white">
          {service.title}
        </h3>

        <p className="mt-4 text-sm leading-7 text-slate-400">
          {service.description}
        </p>
      </div>

      {/* Offerings */}
      <div className="mt-7 border-t border-white/10 pt-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300">
          Areas of service
        </p>

        <ul className="flex flex-wrap gap-2">
          {service.offerings.map((offering) => (
            <li
              key={offering}
              className="border border-white/10 px-3 py-2 text-xs leading-4 text-slate-300"
            >
              {offering}
            </li>
          ))}
        </ul>
      </div>

      {/* Card footer */}
      <div className="mt-auto pt-8">
        <a
          href="#contact"
          className="inline-flex items-center gap-3 text-sm font-semibold text-white transition-colors hover:text-blue-400"
        >
          Discuss this service
          <span
            aria-hidden="true"
            className="text-blue-400"
          >
            →
          </span>
        </a>
      </div>
    </article>
  );
}

export default ServiceCard;
