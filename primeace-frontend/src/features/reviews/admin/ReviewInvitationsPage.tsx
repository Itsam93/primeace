import {
  useCallback,
  useEffect,
  useState,
  type FormEvent
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  X
} from "lucide-react";

import { apiRequest } from "../../../lib/api";

type InvitationStatus =
  | "pending"
  | "submitted"
  | "expired"
  | "revoked";

interface InvitationProject {
  _id: string;
  projectReference: string;
  title: string;
  status?: string;
}

interface InvitationClient {
  _id: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
}

interface ReviewInvitation {
  _id: string;
  invitationReference: string;
  projectId: InvitationProject | string;
  clientId: InvitationClient | string;
  status: InvitationStatus;
  sentAt: string | null;
  expiresAt: string;
  submittedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EligibleProject {
  _id: string;
  projectReference: string;
  title: string;
  clientId: string;
  clientSnapshot: {
    fullName: string;
    email: string;
    phone: string;
  };
  completedAt: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InvitationListResponse {
  invitations: ReviewInvitation[];
  pagination: Pagination;
}

interface InvitationEmailResult {
  sent: boolean;
  sentAt: string | null;
  message: string;
}

interface InvitationActionResponse {
  invitation: ReviewInvitation;
  email: InvitationEmailResult;
}

type InvitationFilter = "" | InvitationStatus;

const PAGE_SIZE = 10;

const STATUS_OPTIONS: {
  label: string;
  value: InvitationFilter;
}[] = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Submitted", value: "submitted" },
  { label: "Expired", value: "expired" },
  { label: "Revoked", value: "revoked" }
];

function getProject(
  project: ReviewInvitation["projectId"]
): InvitationProject | null {
  return typeof project === "string" ? null : project;
}

function getClient(
  client: ReviewInvitation["clientId"]
): InvitationClient | null {
  return typeof client === "string" ? null : client;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function getStatusClasses(status: InvitationStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700";

    case "submitted":
      return "bg-emerald-50 text-emerald-700";

    case "expired":
      return "bg-slate-100 text-slate-600";

    case "revoked":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getStatusLabel(status: InvitationStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function ReviewsInvitationsPage() {
  const [invitations, setInvitations] = useState<ReviewInvitation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0
  });

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<InvitationFilter>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eligibleProjects, setEligibleProjects] = useState<
    EligibleProject[]
  >([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  const loadInvitations = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);

      setError("");

      try {
        const params = new URLSearchParams({
          page: String(pagination.page),
          limit: String(PAGE_SIZE)
        });

        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);

        const result = await apiRequest<InvitationListResponse>(
          `/review-invitations?${params.toString()}`
        );

        setInvitations(result.invitations);
        setPagination(result.pagination);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load review invitations."
        );
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, search, statusFilter]
  );

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  async function openCreateModal() {
    setShowCreateModal(true);
    setCreateError("");
    setSelectedProjectId("");
    setEligibleProjects([]);
    setLoadingProjects(true);

    try {
      const projects = await apiRequest<EligibleProject[]>(
        "/reviews/eligible-projects"
      );

      setEligibleProjects(projects);
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Unable to load eligible projects."
      );
    } finally {
      setLoadingProjects(false);
    }
  }

  async function handleCreateInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      setCreateError("Select a project before continuing.");
      return;
    }

    setCreating(true);
    setCreateError("");
    setActionMessage("");

    try {
      const result = await apiRequest<InvitationActionResponse>(
        "/review-invitations",
        {
          method: "POST",
          body: JSON.stringify({
            projectId: selectedProjectId
          })
        }
      );

      setShowCreateModal(false);
      setPageToFirst();

      setActionMessage(
        result.email.sent
          ? "Review invitation created and email sent successfully."
          : `Invitation created, but the email could not be sent. ${result.email.message}`
      );

      await loadInvitations(false);
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Unable to create review invitation."
      );
    } finally {
      setCreating(false);
    }
  }

  function setPageToFirst() {
    setPagination((current) => ({
      ...current,
      page: 1
    }));
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPagination((current) => ({
      ...current,
      page: 1
    }));

    setSearch(searchInput.trim());
  }

  async function handleInvitationAction(
    invitation: ReviewInvitation,
    action: "resend" | "renew" | "revoke"
  ) {
    const actionLabels = {
      resend: "resend the invitation email",
      renew: "renew this invitation and invalidate its previous link",
      revoke: "revoke this invitation"
    };

    if (
      !window.confirm(
        `Are you sure you want to ${actionLabels[action]}?`
      )
    ) {
      return;
    }

    setProcessingId(invitation._id);
    setActionMessage("");
    setError("");

    try {
      if (action === "revoke") {
        await apiRequest<ReviewInvitation>(
          `/review-invitations/${invitation._id}/revoke`,
          { method: "POST" }
        );

        setActionMessage("Review invitation revoked successfully.");
      } else if (action === "renew") {
        const result = await apiRequest<InvitationActionResponse>(
          `/review-invitations/${invitation._id}/renew`,
          { method: "POST" }
        );

        setActionMessage(
          result.email.sent
            ? "Invitation renewed and email sent successfully."
            : `Invitation renewed, but the email could not be sent. ${result.email.message}`
        );
      } else {
        const result = await apiRequest<{
          email: InvitationEmailResult;
        }>(
          `/review-invitations/${invitation._id}/resend`,
          { method: "POST" }
        );

        setActionMessage(
          result.email.sent
            ? "Invitation email resent successfully."
            : `The email could not be sent. ${result.email.message}`
        );
      }

      await loadInvitations(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The requested action could not be completed."
      );
    } finally {
      setProcessingId(null);
    }
  }

  function goToPage(page: number) {
    setPagination((current) => ({
      ...current,
      page
    }));
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#07152F]">
            Review Invitations
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage invitations sent to completed project clients.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadInvitations()}
            disabled={loading}
            className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => void openCreateModal()}
            className="inline-flex items-center gap-2 bg-[#1556D6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1048B8]"
          >
            <Plus size={17} />
            Create Invitation
          </button>
        </div>
      </div>

      {/* Feedback */}
      {actionMessage && (
        <div
          role="status"
          className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{actionMessage}</p>
          <button
            type="button"
            onClick={() => setActionMessage("")}
            className="ml-auto"
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row">
        <form
          onSubmit={handleSearch}
          className="flex flex-1 gap-2"
        >
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search reference, project or client..."
              className="w-full border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#1556D6]"
            />
          </div>

          <button
            type="submit"
            className="bg-[#07152F] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as InvitationFilter);
            setPagination((current) => ({
              ...current,
              page: 1
            }));
          }}
          className="border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1556D6] sm:w-44"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Invitation table */}
      <div className="overflow-hidden border border-slate-200 bg-white">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading invitations...
          </div>
        ) : invitations.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <Mail size={30} className="text-slate-300" />

            <h2 className="mt-4 text-base font-semibold text-[#07152F]">
              No review invitations found
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              Invitations will appear here when you create them for eligible completed projects.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Invitation
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Client
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Project
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Sent
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Expires
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {invitations.map((invitation) => {
                    const project = getProject(invitation.projectId);
                    const client = getClient(invitation.clientId);
                    const isProcessing =
                      processingId === invitation._id;

                    return (
                      <tr
                        key={invitation._id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#07152F]">
                            {invitation.invitationReference}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Created {formatDate(invitation.createdAt)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-800">
                            {client?.fullName ?? "Client"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {client?.email ?? "Email unavailable"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-800">
                            {project?.projectReference ?? "—"}
                          </p>
                          <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
                            {project?.title ?? "Project details unavailable"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(invitation.status)}`}
                          >
                            {getStatusLabel(invitation.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(invitation.sentAt)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(invitation.expiresAt)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {invitation.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  title="Resend invitation email"
                                  aria-label={`Resend invitation ${invitation.invitationReference}`}
                                  disabled={isProcessing}
                                  onClick={() =>
                                    void handleInvitationAction(
                                      invitation,
                                      "resend"
                                    )
                                  }
                                  className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 text-slate-600 transition hover:border-[#1556D6] hover:text-[#1556D6] disabled:opacity-50"
                                >
                                  {isProcessing ? (
                                    <LoaderCircle
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Mail size={16} />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  title="Renew invitation"
                                  aria-label={`Renew invitation ${invitation.invitationReference}`}
                                  disabled={isProcessing}
                                  onClick={() =>
                                    void handleInvitationAction(
                                      invitation,
                                      "renew"
                                    )
                                  }
                                  className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 text-slate-600 transition hover:border-amber-500 hover:text-amber-600 disabled:opacity-50"
                                >
                                  <RotateCw size={16} />
                                </button>

                                <button
                                  type="button"
                                  title="Revoke invitation"
                                  aria-label={`Revoke invitation ${invitation.invitationReference}`}
                                  disabled={isProcessing}
                                  onClick={() =>
                                    void handleInvitationAction(
                                      invitation,
                                      "revoke"
                                    )
                                  }
                                  className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 text-slate-600 transition hover:border-red-500 hover:text-red-600 disabled:opacity-50"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}

                            {(invitation.status === "expired" ||
                              invitation.status === "revoked") && (
                              <button
                                type="button"
                                title="Renew invitation"
                                aria-label={`Renew invitation ${invitation.invitationReference}`}
                                disabled={isProcessing}
                                onClick={() =>
                                  void handleInvitationAction(
                                    invitation,
                                    "renew"
                                  )
                                }
                                className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 text-slate-600 transition hover:border-[#1556D6] hover:text-[#1556D6] disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <RotateCw size={16} />
                                )}
                              </button>
                            )}

                            {invitation.status === "submitted" && (
                              <span className="text-xs text-slate-400">
                                Completed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                {pagination.total === 0
                  ? 0
                  : (pagination.page - 1) * pagination.limit + 1}
                {"–"}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                of {pagination.total} invitations
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="px-2 text-sm text-slate-600">
                  Page {pagination.page} of{" "}
                  {Math.max(pagination.totalPages, 1)}
                </span>

                <button
                  type="button"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={
                    pagination.page >= pagination.totalPages
                  }
                  className="border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create invitation modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creating) {
              setShowCreateModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-invitation-title"
            className="w-full max-w-lg bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="create-invitation-title"
                  className="text-lg font-bold text-[#07152F]"
                >
                  Create Review Invitation
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select a completed project to invite its client.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                aria-label="Close modal"
                className="text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateInvitation}
              className="space-y-5 p-6"
            >
              {createError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"
                >
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0"
                  />
                  {createError}
                </div>
              )}

              <div>
                <label
                  htmlFor="invitation-project"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Completed project
                </label>

                {loadingProjects ? (
                  <div className="flex items-center gap-2 border border-slate-200 px-3 py-3 text-sm text-slate-500">
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                    Loading eligible projects...
                  </div>
                ) : eligibleProjects.length === 0 ? (
                  <div className="border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    No eligible projects are currently available.
                  </div>
                ) : (
                  <select
                    id="invitation-project"
                    value={selectedProjectId}
                    onChange={(event) =>
                      setSelectedProjectId(event.target.value)
                    }
                    required
                    className="w-full border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#1556D6]"
                  >
                    <option value="">
                      Select a project
                    </option>

                    {eligibleProjects.map((project) => (
                      <option
                        key={project._id}
                        value={project._id}
                      >
                        {project.projectReference} — {project.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedProjectId && (
                <div className="border border-slate-200 bg-slate-50 p-4">
                  {(() => {
                    const project = eligibleProjects.find(
                      (item) => item._id === selectedProjectId
                    );

                    if (!project) return null;

                    return (
                      <>
                        <p className="text-sm font-semibold text-[#07152F]">
                          {project.clientSnapshot.fullName}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {project.clientSnapshot.email}
                        </p>

                        <p className="mt-3 text-xs text-slate-500">
                          The invitation link will be sent to this email address.
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creating ||
                    loadingProjects ||
                    !selectedProjectId
                  }
                  className="inline-flex items-center gap-2 bg-[#1556D6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1048B8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create and Send
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewsInvitationsPage;
