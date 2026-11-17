import type { LucideIcon } from "lucide-react";

type StatAccent = "blue" | "violet" | "amber" | "emerald";

interface IDashboardStatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  accent?: StatAccent;
  description?: string;
}

const accentStyles: Record<StatAccent, string> = {
  blue: "text-[#1556D6]",
  violet: "text-violet-700",
  amber: "text-amber-700",
  emerald: "text-emerald-700"
};

function DashboardStatCard({
  title,
  value,
  icon: Icon,
  accent = "blue",
  description
}: IDashboardStatCardProps) {
  return (
    <article className="
      group relative min-w-0 overflow-hidden
      rounded-xl border border-slate-200
      bg-white p-5
      transition-colors duration-200
      hover:border-slate-300
      sm:p-5
    ">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-4 text-[30px] font-semibold leading-none tracking-tight tabular-nums text-[#07152F]">
            {value.toLocaleString()}
          </p>
        </div>

        <div className={`
          flex h-9 w-9 shrink-0 items-center
          justify-center rounded-lg bg-slate-50
          ${accentStyles[accent]}
        `}>
          <Icon size={18} strokeWidth={1.9} />
        </div>
      </div>

      {description ? (
        <div className="mt-5 border-t border-slate-100 pt-3">
          <p className="text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      ) : (
        <div className="mt-5 border-t border-slate-100 pt-3">
          <p className="text-xs leading-5 text-slate-400">
            Current total
          </p>
        </div>
      )}
    </article>
  );
}

export default DashboardStatCard;
