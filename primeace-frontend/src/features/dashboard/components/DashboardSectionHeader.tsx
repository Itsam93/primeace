import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface IDashboardSectionHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

function DashboardSectionHeader({
  title,
  description,
  actionLabel,
  actionHref
}: IDashboardSectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-[#07152F] sm:text-lg">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>

      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="
            inline-flex shrink-0 items-center gap-1.5
            rounded-sm text-sm font-semibold text-[#1556D6]
            transition-colors hover:text-blue-800
            focus-visible:outline-2 focus-visible:outline-offset-4
            focus-visible:outline-[#1556D6]
          "
        >
          {actionLabel}
          <ArrowRight size={15} strokeWidth={1.9} />
        </Link>
      )}
    </div>
  );
}

export default DashboardSectionHeader;