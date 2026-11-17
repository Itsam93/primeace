import {
  useCallback,
  useEffect,
  useState
} from "react";

import type {
  FormEvent,
  ReactNode
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  User,
  Building2,
  ClipboardList,
  MessageSquareText,
  Send,
  ShieldCheck
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { ApiError } from "../../../lib/api.js";

import {
  createServiceRequestNote,
  getServiceRequestById,
  getServiceRequestNotes,
  updateServiceRequestStatus
} from "../services/serviceRequest.Service.js";

import type {
  IServiceRequestDetails,
  IServiceRequestNote,
  IServiceRequestPaginationMeta,
  ServiceRequestStatus
} from "../types/serviceRequest.types.js";

const NOTES_PAGE_SIZE = 20;

const allowedStatusTransitions: Record<
  ServiceRequestStatus,
  ServiceRequestStatus[]
> = {
  new: [
    "under_review",
    "declined",
    "closed"
  ],
  under_review: [
    "awaiting_information",
    "quoted",
    "declined",
    "closed"
  ],
  awaiting_information: [
    "under_review",
    "declined",
    "closed"
  ],
  quoted: [
    "converted",
    "declined",
    "closed"
  ],
  converted: [
    "closed"
  ],
  declined: [
    "closed"
  ],
  closed: []
};


function getStatusStyles(status: ServiceRequestStatus): string {
  switch (status) {
    case "new":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "under_review":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "awaiting_information":
      return "bg-orange-50 text-orange-700 ring-orange-600/20";

    case "quoted":
      return "bg-violet-50 text-violet-700 ring-violet-600/20";

    case "converted":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "declined":
      return "bg-red-50 text-red-700 ring-red-600/20";

    case "closed":
      return "bg-slate-100 text-slate-600 ring-slate-500/20";

    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }
}

function getStatusLabel(status: ServiceRequestStatus): string {
  const labels: Record<ServiceRequestStatus, string> = {
    new: "New",
    under_review: "Under Review",
    awaiting_information: "Awaiting Information",
    quoted: "Quoted",
    converted: "Converted",
    declined: "Declined",
    closed: "Closed"
  };

  return labels[status];
}

function formatDate(value: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatDateTime(value: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatAnswerLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "Not provided";
    }

    return value
      .map((item) => formatAnswerValue(item))
      .join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function DetailField({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-medium text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div>
        <h2 className="font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  return error instanceof ApiError
    ? error.message
    : fallback;
}

export default function ServiceRequestDetailsPage() {
  const { requestId } = useParams<{ requestId: string }>();

  const [request, setRequest] =
    useState<IServiceRequestDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status management
  const [selectedStatus, setSelectedStatus] =
    useState<ServiceRequestStatus | "">("");

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusSuccess, setStatusSuccess] = useState("");

  // Internal notes
  const [notes, setNotes] = useState<IServiceRequestNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState("");

  const [noteContent, setNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSubmitError, setNoteSubmitError] = useState("");

  const [notesPage, setNotesPage] = useState(1);

  const [notesPagination, setNotesPagination] =
    useState<IServiceRequestPaginationMeta>({
      page: 1,
      limit: NOTES_PAGE_SIZE,
      total: 0,
      totalPages: 0
    });

  const loadRequest = useCallback(async () => {
    if (!requestId) {
      setError("The service request ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getServiceRequestById(requestId);

      setRequest(result);
      setSelectedStatus(result.status);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to retrieve this service request. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  const loadNotes = useCallback(
    async (page = 1) => {
      if (!requestId) {
        setNotesError("The service request ID is missing.");
        setNotesLoading(false);
        return;
      }

      try {
        setNotesLoading(true);
        setNotesError("");

        const result = await getServiceRequestNotes(
          requestId,
          page,
          NOTES_PAGE_SIZE
        );

        setNotes(result.notes);
        setNotesPagination(result.pagination);
        setNotesPage(page);
      } catch (err) {
        setNotesError(
          getErrorMessage(
            err,
            "Unable to load internal notes. Please try again."
          )
        );
      } finally {
        setNotesLoading(false);
      }
    },
    [requestId]
  );

  useEffect(() => {
    void loadRequest();
    void loadNotes(1);
  }, [loadRequest, loadNotes]);

  const availableStatuses = request
    ? allowedStatusTransitions[request.status]
    : [];

  const handleStatusUpdate = async () => {
    if (!requestId || !request || !selectedStatus) {
      return;
    }

    if (
      selectedStatus === request.status ||
      !availableStatuses.includes(selectedStatus)
    ) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusError("");
      setStatusSuccess("");

      const updatedRequest = await updateServiceRequestStatus(
        requestId,
        {
          status: selectedStatus
        }
      );

      setRequest(updatedRequest);
      setSelectedStatus(updatedRequest.status);

      setStatusSuccess(
        `Request status updated to ${getStatusLabel(updatedRequest.status)}.`
      );
    } catch (err) {
      setStatusError(
        getErrorMessage(
          err,
          "Unable to update the request status. Please try again."
        )
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleNoteSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!requestId) return;

    const content = noteContent.trim();

    if (!content || content.length > 5000) {
      return;
    }

    try {
      setSubmittingNote(true);
      setNoteSubmitError("");

      await createServiceRequestNote(requestId, {
        content
      });

      setNoteContent("");

      // Reload the first page so the newest note is displayed.
      await loadNotes(1);
    } catch (err) {
      setNoteSubmitError(
        getErrorMessage(
          err,
          "Unable to add your internal note. Please try again."
        )
      );
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleNotePageChange = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > notesPagination.totalPages ||
      notesLoading
    ) {
      return;
    }

    void loadNotes(nextPage);
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw
            size={19}
            className="animate-spin text-blue-600"
          />

          Loading service request...
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="space-y-5">
        <Link
          to="/admin/requests"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Service Requests
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load service request
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error || "The requested service request could not be found."}
              </p>

              <button
                type="button"
                onClick={() => void loadRequest()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        to="/admin/requests"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        Back to Service Requests
      </Link>

      {/* Page heading */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <ClipboardList size={16} />
            Service Request Details
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {request.reference}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review the client's submission and manage the service request.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyles(request.status)}`}
          >
            {getStatusLabel(request.status)}
          </span>

          <button
            type="button"
            onClick={() => {
              void loadRequest();
              void loadNotes(notesPage);
            }}
            disabled={loading || updatingStatus}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status management */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <SectionHeading
          title="Manage Request Status"
          description="Update the current status as the request progresses."
          icon={<ShieldCheck size={19} />}
        />

        <div className="mt-6 border-t border-slate-100 pt-5">
          {availableStatuses.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">
                This request has reached a final status.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                No further status changes are available.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="request-status"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  New status
                </label>

                <select
                  id="request-status"
                  value={selectedStatus}
                  onChange={(event) => {
                    setSelectedStatus(
                      event.target.value as ServiceRequestStatus
                    );
                    setStatusError("");
                    setStatusSuccess("");
                  }}
                  disabled={updatingStatus}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value={request.status}>
                    Current: {getStatusLabel(request.status)}
                  </option>

                  {availableStatuses.map((nextStatus) => (
                    <option
                      key={nextStatus}
                      value={nextStatus}
                    >
                      {getStatusLabel(nextStatus)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => void handleStatusUpdate()}
                disabled={
                  updatingStatus ||
                  !selectedStatus ||
                  selectedStatus === request.status
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingStatus ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Update Status
                  </>
                )}
              </button>
            </div>
          )}

          {statusError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <p className="text-sm text-red-700">
                {statusError}
              </p>
            </div>
          )}

          {statusSuccess && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <p className="text-sm text-emerald-700">
                {statusSuccess}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Request overview */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FileText size={19} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Request Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              General information and submission timeline.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField
            label="Request Reference"
            value={request.reference}
          />

          <DetailField
            label="Current Status"
            value={getStatusLabel(request.status)}
          />

          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <CalendarDays size={14} />

              <p className="text-xs font-medium uppercase tracking-wider">
                Date Submitted
              </p>
            </div>

            <p className="mt-1.5 text-sm font-medium text-slate-800">
              {formatDate(request.submittedAt)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock3 size={14} />

              <p className="text-xs font-medium uppercase tracking-wider">
                Submission Time
              </p>
            </div>

            <p className="mt-1.5 text-sm font-medium text-slate-800">
              {formatDateTime(request.submittedAt)}
            </p>
          </div>
        </div>
      </section>

      {/* Client snapshot */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <SectionHeading
          title="Client Information"
          description="Contact information captured when this request was submitted."
          icon={<User size={19} />}
        />

        <div className="mt-6 grid gap-6 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <DetailField
            label="Full Name"
            value={request.clientSnapshot.fullName}
          />

          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <Mail size={14} />

              <p className="text-xs font-medium uppercase tracking-wider">
                Email Address
              </p>
            </div>

            <p className="mt-1.5 break-all text-sm font-medium text-slate-800">
              {request.clientSnapshot.email || "No email provided"}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <Phone size={14} />

              <p className="text-xs font-medium uppercase tracking-wider">
                Phone Number
              </p>
            </div>

            <p className="mt-1.5 text-sm font-medium text-slate-800">
              {request.clientSnapshot.phone}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <Building2 size={14} />

              <p className="text-xs font-medium uppercase tracking-wider">
                Organisation
              </p>
            </div>

            <p className="mt-1.5 text-sm font-medium text-slate-800">
              {request.clientSnapshot.organisation || "Not provided"}
            </p>
          </div>
        </div>
      </section>

      {/* Requested services */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <SectionHeading
          title="Requested Services"
          description={`${request.items.length} ${request.items.length === 1 ? "service was" : "services were"} included in this submission.`}
          icon={<ClipboardList size={19} />}
        />

        <div className="mt-6 space-y-5">
          {request.items.map((item, index) => {
            const answers = Object.entries(item.answers ?? {});
            const fileIds = item.fileIds ?? [];

            return (
              <div
                key={item._id}
                className="overflow-hidden rounded-xl border border-slate-200"
              >
                {/* Service heading */}
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      Service {index + 1}
                    </p>

                    <h3 className="mt-1 font-semibold text-slate-900">
                      {item.serviceName}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {item.categoryName}
                    </p>
                  </div>

                  <span className="w-fit rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                    Form version {item.formVersion}
                  </span>
                </div>

                {/* Submitted answers */}
                <div className="p-4 sm:p-5">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Submitted Form Answers
                  </h4>

                  {answers.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-400">
                      No form answers were recorded for this service.
                    </p>
                  ) : (
                    <div className="mt-4 divide-y divide-slate-100">
                      {answers.map(([question, answer]) => (
                        <div
                          key={question}
                          className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-6"
                        >
                          <p className="text-sm font-medium text-slate-500">
                            {formatAnswerLabel(question)}
                          </p>

                          <p className="whitespace-pre-wrap break-words text-sm text-slate-800">
                            {formatAnswerValue(answer)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Uploaded files */}
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <h4 className="text-sm font-semibold text-slate-800">
                      Uploaded Files
                    </h4>

                    {fileIds.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-400">
                        No files were attached to this service.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-slate-500">
                          {fileIds.length} uploaded{" "}
                          {fileIds.length === 1 ? "file" : "files"}{" "}
                          associated with this service.
                        </p>

                        {fileIds.map((fileId) => (
                          <div
                            key={fileId}
                            className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
                          >
                            <FileText
                              size={15}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="break-all text-xs text-slate-600">
                              {fileId}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Internal notes */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <SectionHeading
          title="Internal Notes"
          description="Private administrative notes about this service request. These notes are not shared with the client."
          icon={<MessageSquareText size={19} />}
        />

        {/* Add note form */}
        <form
          onSubmit={handleNoteSubmit}
          className="mt-6 border-t border-slate-100 pt-5"
        >
          <label
            htmlFor="internal-note"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Add an internal note
          </label>

          <textarea
            id="internal-note"
            value={noteContent}
            onChange={(event) => {
              setNoteContent(event.target.value);
              setNoteSubmitError("");
            }}
            maxLength={5000}
            rows={4}
            placeholder="Record an update, observation or follow-up action..."
            disabled={submittingNote}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-50"
          />

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              {noteContent.length.toLocaleString("en-NG")} / 5,000 characters
            </p>

            <button
              type="submit"
              disabled={
                submittingNote ||
                !noteContent.trim() ||
                noteContent.trim().length > 5000
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingNote ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Adding note...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Add Note
                </>
              )}
            </button>
          </div>

          {noteSubmitError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <p className="text-sm text-red-700">
                {noteSubmitError}
              </p>
            </div>
          )}
        </form>

        {/* Notes list */}
        <div className="mt-7 border-t border-slate-100 pt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Note History
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {notesPagination.total.toLocaleString("en-NG")}{" "}
                {notesPagination.total === 1 ? "note" : "notes"} recorded
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadNotes(notesPage)}
              disabled={notesLoading}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={notesLoading ? "animate-spin" : ""}
              />
              Refresh notes
            </button>
          </div>

          {notesError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div className="flex-1">
                <p className="text-sm text-red-700">
                  {notesError}
                </p>

                <button
                  type="button"
                  onClick={() => void loadNotes(notesPage)}
                  className="mt-2 text-xs font-semibold text-red-700 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {notesLoading ? (
            <div className="flex min-h-36 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <RefreshCw
                  size={17}
                  className="animate-spin text-blue-600"
                />
                Loading internal notes...
              </div>
            </div>
          ) : notesError ? null : notes.length === 0 ? (
            <div className="mt-4 flex min-h-36 flex-col items-center justify-center rounded-lg bg-slate-50 px-4 text-center">
              <MessageSquareText
                size={24}
                className="text-slate-300"
              />

              <p className="mt-3 text-sm font-medium text-slate-700">
                No internal notes yet
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Notes added by administrators will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {notes.map((note) => (
                <article
                  key={note._id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {note.adminId.fullName}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {note.adminId.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock3 size={13} />
                      {formatDateTime(note.createdAt)}
                    </div>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {note.content}
                  </p>
                </article>
              ))}
            </div>
          )}

          {/* Notes pagination */}
          {!notesLoading &&
            !notesError &&
            notesPagination.totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  Page {notesPage} of {notesPagination.totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleNotePageChange(notesPage - 1)
                    }
                    disabled={notesPage <= 1 || notesLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleNotePageChange(notesPage + 1)
                    }
                    disabled={
                      notesPage >= notesPagination.totalPages ||
                      notesLoading
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
        </div>
      </section>

      {/* Record timestamps */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Record Information
        </h2>

        <div className="mt-4 grid gap-5 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <DetailField
            label="Record Created"
            value={formatDateTime(request.createdAt)}
          />

          <DetailField
            label="Last Updated"
            value={formatDateTime(request.updatedAt)}
          />
        </div>
      </section>
    </div>
  );
}
