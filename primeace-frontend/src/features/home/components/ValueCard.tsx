import type { Value } from "../data/values";

interface ValueCardProps {
  value: Value;
}

function ValueCard({ value }: ValueCardProps) {
  const Icon = value.icon;

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#1556D6]/40 hover:shadow-lg hover:shadow-slate-200/60">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1556D6]/10 text-[#1556D6] transition-colors duration-300 group-hover:bg-[#1556D6] group-hover:text-white">
          <Icon size={24} strokeWidth={1.8} />
        </div>

        <span className="text-sm font-semibold tracking-wider text-slate-300">
          {value.number}
        </span>
      </div>

      <h3 className="mt-6 text-lg font-bold leading-snug text-[#0A1F44]">
        {value.title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-slate-600">
        {value.description}
      </p>
    </article>
  );
}

export default ValueCard;
