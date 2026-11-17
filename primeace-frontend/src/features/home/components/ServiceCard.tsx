import type { Service } from "../data/services";

interface ServiceCardProps {
  service: Service;
}

function ServiceCard({ service }: ServiceCardProps) {
  const Icon = service.icon;

  return (
    <article
      className="group relative flex min-h-[460px] flex-col justify-between overflow-hidden border border-white/15 bg-[#07152F] bg-cover bg-center bg-no-repeat p-7 text-white sm:min-h-[480px] sm:p-10 lg:p-14"
      style={{
        backgroundImage: `url("${service.backgroundImage}")`
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#07152F]/90 via-[#07152F]/75 to-[#07152F]/40" />

      {/* Service header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center border border-white/20 bg-white/10 text-white transition-colors duration-300 group-hover:bg-[#1556D6]">
          <Icon size={27} strokeWidth={1.8} />
        </div>

        <span className="text-sm font-semibold tracking-wider text-white/60">
          {service.number}
        </span>
      </div>

      {/* Service information */}
      <div className="relative z-10 mt-16 max-w-2xl">
        <h3 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
          {service.title}
        </h3>

        <p className="mt-5 max-w-xl text-sm leading-8 text-slate-200 sm:text-base">
          {service.description}
        </p>

        <div className="mt-7 flex flex-wrap gap-2">
          {service.offerings.map((offering) => (
            <span
              key={offering}
              className="border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white/90"
            >
              {offering}
            </span>
          ))}
        </div>

        <a
          href="#contact"
          className="mt-9 inline-flex w-fit items-center gap-3 border-b border-blue-400 pb-2 text-sm font-semibold text-white transition-colors hover:text-blue-300"
        >
          Discuss this service
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}

export default ServiceCard;
