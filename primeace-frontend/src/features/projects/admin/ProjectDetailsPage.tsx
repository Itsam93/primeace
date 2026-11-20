import {
  useCallback,
  useEffect,
  useState
} from "react";

import { Link, useParams } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Pencil,
  RefreshCw,
  UserRound
} from "lucide-react";

import {
  ProjectSource,
  ProjectStatus
} from "@primeace/shared";

import { ApiError } from "../../../lib/api.js";

import {
  getProjectById,
  updateProjectFeatured,
  updateProjectStatus
} from "../services/project.service.js";

import type {
  ProjectDetail
} from "../types/project.types.js";

const statusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.NOT_STARTED]: "Not started",
  [ProjectStatus.IN_PROGRESS]: "In progress",
  [ProjectStatus.UNDER_REVIEW]: "Under review",
  [ProjectStatus.ON_HOLD]: "On hold",
  [ProjectStatus.COMPLETED]: "Completed",
  [ProjectStatus.CANCELLED]: "Cancelled"
};

const statusStyles: Record<ProjectStatus, string> = {
  [ProjectStatus.NOT_STARTED]: "bg-gray-100 text-gray-700",
  [ProjectStatus.IN_PROGRESS]: "bg-blue-100 text-blue-700",
  [ProjectStatus.UNDER_REVIEW]: "bg-purple-100 text-purple-700",
  [ProjectStatus.ON_HOLD]: "bg-amber-100 text-amber-700",
  [ProjectStatus.COMPLETED]: "bg-green-100 text-green-700",
  [ProjectStatus.CANCELLED]: "bg-red-100 text-red-700"
};

const sourceLabels: Record<ProjectSource, string> = {
  [ProjectSource.CONTRACT]: "Contract project",
  [ProjectSource.HISTORICAL]: "Historical project"
};

const sourceStyles: Record<ProjectSource, string> = {
  [ProjectSource.CONTRACT]: "bg-blue-50 text-blue-700",
  [ProjectSource.HISTORICAL]: "bg-amber-50 text-amber-700"
};

const projectStatuses = Object.values(ProjectStatus);

function formatCurrency(amountKobo: number | null): string {
  if (amountKobo === null) return "—";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2
  }).format(amountKobo / 100);
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function DetailItem({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-gray-900">
        {value}
      </p>
    </div>
  );
}

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<ProjectDetail | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(
    ProjectStatus.NOT_STARTED
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingFeatured, setUpdatingFeatured] = useState(false);

  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [featuredError, setFeaturedError] = useState("");
  const [featuredMessage, setFeaturedMessage] = useState("");

  const fetchProject = useCallback(
    async (showRefresh = false) => {
      if (!projectId) {
        setError("Project ID is missing.");
        setLoading(false);
        return;
      }

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const result = await getProjectById(projectId);

        setProject(result);
        setSelectedStatus(result.status);
        setStatusError("");
        setStatusMessage("");
        setFeaturedError("");
        setFeaturedMessage("");
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load project details. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  const handleRefresh = () => {
    void fetchProject(true);
  };

  const handleStatusUpdate = async () => {
    if (!project || !projectId) return;
    if (selectedStatus === project.status) return;

    try {
      setUpdatingStatus(true);
      setStatusError("");
      setStatusMessage("");
      setFeaturedError("");
      setFeaturedMessage("");

      const wasFeatured = project.isFeatured;

      const updatedProject = await updateProjectStatus(
        projectId,
        selectedStatus
      );

      setProject(updatedProject);
      setSelectedStatus(updatedProject.status);

      setStatusMessage(
        wasFeatured && !updatedProject.isFeatured
          ? "Project status updated successfully. It has also been removed from the public website."
          : "Project status updated successfully."
      );
    } catch (err) {
      setStatusError(
        err instanceof ApiError
          ? err.message
          : "Unable to update project status. Please try again."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFeaturedUpdate = async () => {
    if (!project || !projectId) return;
    if (project.status !== ProjectStatus.COMPLETED) return;

    const nextFeaturedStatus = !project.isFeatured;

    try {
      setUpdatingFeatured(true);
      setFeaturedError("");
      setFeaturedMessage("");

      const updatedProject = await updateProjectFeatured(
        projectId,
        nextFeaturedStatus
      );

      setProject(updatedProject);

      setFeaturedMessage(
        updatedProject.isFeatured
          ? "Project is now featured on the public website."
          : "Project has been removed from the public website."
      );
    } catch (err) {
      setFeaturedError(
        err instanceof ApiError
          ? err.message
          : "Unable to update website visibility. Please try again."
      );
    } finally {
      setUpdatingFeatured(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
        <RefreshCw size={18} className="animate-spin" />
        Loading project details...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to projects
        </Link>

        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />

          <div className="flex-1">
            <p className="font-medium">
              Unable to load project
            </p>

            <p className="mt-1">
              {error || "The requested project could not be found."}
            </p>

            {projectId && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="mt-3 inline-flex items-center gap-2 font-medium text-red-800 hover:underline disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isHistoricalProject =
    project.source === ProjectSource.HISTORICAL;

  const isCompleted =
    project.status === ProjectStatus.COMPLETED;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to projects
        </Link>
      </div>

      {/* Project heading and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">
              {project.projectReference}
            </h1>

            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[project.status]}`}
            >
              {statusLabels[project.status]}
            </span>

            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${sourceStyles[project.source]}`}
            >
              {sourceLabels[project.source]}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            {project.title}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/admin/projects/${project.id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Pencil size={16} />
            Edit project
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || updatingStatus || updatingFeatured}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Project information */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <BriefcaseBusiness size={19} className="text-gray-500" />

              <h2 className="font-semibold text-gray-900">
                Project information
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Project reference"
                value={project.projectReference}
              />

              <DetailItem
                label="Project source"
                value={sourceLabels[project.source]}
              />

              <DetailItem
                label="Project status"
                value={statusLabels[project.status]}
              />

              <DetailItem
                label="Project category"
                value={project.category?.name || "Unassigned"}
              />

              <DetailItem
                label={isHistoricalProject ? "Project amount" : "Contract amount"}
                value={formatCurrency(project.contractAmountKobo)}
              />

              <DetailItem
                label="Start date"
                value={formatDate(project.startDate)}
              />

              <DetailItem
                label="Expected completion"
                value={formatDate(project.expectedCompletionDate)}
              />

              <DetailItem
                label="Completed on"
                value={formatDate(project.completedAt)}
              />
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Project description
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {project.description || "No project description provided."}
              </p>
            </div>
          </section>

          {/* Project media */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Eye size={19} className="text-gray-500" />

              <h2 className="font-semibold text-gray-900">
                Project media
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Cover image
                </p>

                {project.coverImage ? (
                  <a
                    href={project.coverImage.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block max-w-xl overflow-hidden rounded-lg border border-gray-200"
                  >
                    <img
                      src={project.coverImage.url}
                      alt={project.coverImage.alt || project.title}
                      className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">
                    No cover image has been added.
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Video clip
                </p>

                {project.videoClip ? (
                  <div className="max-w-xl space-y-3">
                    <video
                      controls
                      preload="metadata"
                      poster={project.videoClip.thumbnailUrl || undefined}
                      className="aspect-video w-full rounded-lg bg-black"
                    >
                      <source src={project.videoClip.url} />
                      Your browser does not support video playback.
                    </video>

                    {project.videoClip.alt && (
                      <p className="text-sm text-gray-500">
                        {project.videoClip.alt}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No video clip has been added.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Project services */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <FileText size={19} className="text-gray-500" />

              <h2 className="font-semibold text-gray-900">
                Project services
              </h2>
            </div>

            {project.serviceNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.serviceNames.map((service, index) => (
                  <span
                    key={`${service}-${index}`}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  >
                    {service}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No services recorded for this project.
              </p>
            )}
          </section>

          {/* Related records */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <FileText size={19} className="text-gray-500" />

              <h2 className="font-semibold text-gray-900">
                Related records
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Client record
                </p>

                <Link
                  to={`/admin/clients/${project.clientId}`}
                  className="mt-1 inline-block text-sm font-medium text-blue-700 hover:underline"
                >
                  View client
                </Link>
              </div>

              {isHistoricalProject ? (
                <div className="sm:col-span-1">
                  <p className="text-sm text-gray-500">
                    This project was added manually as historical work.
                    It is not linked to a service request, quotation or contract.
                  </p>
                </div>
              ) : (
                <>
                  <DetailItem
                    label="Service request ID"
                    value={project.serviceRequestId || "—"}
                  />

                  <DetailItem
                    label="Quotation ID"
                    value={project.quotationId || "—"}
                  />

                  <DetailItem
                    label="Contract ID"
                    value={project.contractId || "—"}
                  />
                </>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Website showcase management */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Globe size={19} className="text-gray-500" />

              <h2 className="font-semibold text-gray-900">
                Website showcase
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  {project.isFeatured ? (
                    <Eye size={17} className="text-green-600" />
                  ) : (
                    <EyeOff size={17} className="text-gray-400" />
                  )}

                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      project.isFeatured
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {project.isFeatured
                      ? "Featured on website"
                      : "Not featured"}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  {project.isFeatured
                    ? "This project is currently displayed on the public Projects page."
                    : "This project is not currently displayed on the public Projects page."}
                </p>
              </div>

              {!isCompleted && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm leading-6 text-amber-800">
                    Only completed projects can be featured on the public website.
                  </p>
                </div>
              )}

              {featuredError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />

                  <p>{featuredError}</p>
                </div>
              )}

              {featuredMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />

                  <p>{featuredMessage}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleFeaturedUpdate()}
                disabled={
                  !isCompleted ||
                  updatingFeatured ||
                  updatingStatus
                }
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  project.isFeatured
                    ? "bg-gray-700 hover:bg-gray-800"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {updatingFeatured ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Updating website visibility...
                  </>
                ) : project.isFeatured ? (
                  <>
                    <EyeOff size={16} />
                    Remove from website
                  </>
                ) : (
                  <>
                    <Eye size={16} />
                    Feature on website
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Status management */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900">
                Update project status
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Change the current progress status of this project.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="project-status"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Project status
                </label>

                <select
                  id="project-status"
                  value={selectedStatus}
                  onChange={(event) => {
                    setSelectedStatus(
                      event.target.value as ProjectStatus
                    );
                    setStatusError("");
                    setStatusMessage("");
                  }}
                  disabled={updatingStatus || updatingFeatured}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  {projectStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              {statusError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />

                  <p>{statusError}</p>
                </div>
              )}

              {statusMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />

                  <p>{statusMessage}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleStatusUpdate()}
                disabled={
                  updatingStatus ||
                  updatingFeatured ||
                  selectedStatus === project.status
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingStatus ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Updating status...
                  </>
                ) : (
                  "Update status"
                )}
              </button>
            </div>
          </section>

          {/* Client information */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <UserRound size={19} className="text-gray-500" />

              <h2 className="font-semibold text-gray-900">
                Client information
              </h2>
            </div>

            <div className="space-y-4">
              <DetailItem
                label="Full name"
                value={project.clientSnapshot.fullName}
              />

              <DetailItem
                label="Email address"
                value={project.clientSnapshot.email || "—"}
              />

              <DetailItem
                label="Phone number"
                value={project.clientSnapshot.phone}
              />

              <Link
                to={`/admin/clients/${project.clientId}`}
                className="inline-flex text-sm font-medium text-blue-700 hover:underline"
              >
                View full client record
              </Link>
            </div>
          </section>

          {/* Record information */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <CalendarDays size={19} className="text-gray-500" />

              <h2 className="font-semibold text-gray-900">
                Record information
              </h2>
            </div>

            <div className="space-y-4">
              <DetailItem
                label="Created"
                value={formatDateTime(project.createdAt)}
              />

              <DetailItem
                label="Last updated"
                value={formatDateTime(project.updatedAt)}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}