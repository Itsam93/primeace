import type { RequestStatus } from "./service-request.type.js";

interface IServiceRequestStatusBadgeProps {
  status: RequestStatus;
}

const statusStyles: Record<RequestStatus, string> = {
  new: "bg-blue-50 text-blue-700 ring-blue-600/20",
  under_review: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  awaiting_information: "bg-amber-50 text-amber-700 ring-amber-600/20",
  quoted: "bg-violet-50 text-violet-700 ring-violet-600/20",
  converted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  declined: "bg-rose-50 text-rose-700 ring-rose-600/20",
  closed: "bg-slate-100 text-slate-600 ring-slate-500/20"
};

const statusLabels: Record<RequestStatus, string> = {
  new: "New",
  under_review: "Under Review",
  awaiting_information: "Awaiting Information",
  quoted: "Quoted",
  converted: "Converted",
  declined: "Declined",
  closed: "Closed"
};

function ServiceRequestStatusBadge({
  status
}: IServiceRequestStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

export default ServiceRequestStatusBadge;
