import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  FolderKanban,
  LoaderCircle,
  ShieldCheck,
  Star,
  UserRound,
  X
} from "lucide-react";

import { ApiError } from "../../../lib/api.js";
import { getReviewById } from "../services/review.service.js";
import type {
  IAdminReview,
  IReviewAdmin,
  IReviewClient,
  IReviewProject
} from "../types/review.type.js";

interface ReviewDetailsModalProps {
  reviewId: string;
  onClose: () => void;
}

function formatDate(value?: string | null): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    hidden: "Hidden"
  };

  return labels[status] ?? status;
}

function getStatusStyles(status: string): string {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    rejected: "bg-red-50 text-red-700 ring-red-600/20",
    hidden: "bg-slate-100 text-slate-600 ring-slate-500/20"
  };

  return styles[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";
}

function getProject(review: IAdminReview): IReviewProject | null {
  return typeof review.projectId === "object"
    ? review.projectId
    : null;
}

function getClient(review: IAdminReview): IReviewClient | null {
  return typeof review.clientId === "object"
    ? review.clientId
    : null;
}

function getAdmin(
  value: IReviewAdmin | string | null | undefined
): IReviewAdmin | null {
  return value && typeof value === "object" ? value : null;
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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-700">
        {value || "Not available"}
      </p>
    </div>
  );
}

export default function ReviewDetailsModal({
  reviewId,
  onClose
}: ReviewDetailsModalProps) {
  const [review, setReview] = useState<IAdminReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReview() {
      setLoading(true);
      setError("");

      try {
        const result = await getReviewById(reviewId);

        if (active) {
          setReview(result);
        }
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load the review details. Please try again."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReview();

    return () => {
      active = false;
    };
  }, [reviewId]);

  const project = review ? getProject(review) : null;
  const client = review ? getClient(review) : null;
  const submittedBy = review ? getAdmin(review.submittedBy) : null;
  const moderatedBy = review ? getAdmin(review.moderatedBy) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-details-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Review management
            </p>
            <h2
              id="review-details-title"
              className="mt-1 text-lg font-semibold text-slate-900"
            >
              Review details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close review details"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {loading && (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
              <LoaderCircle size={28} className="animate-spin text-blue-600" />
              <p className="text-sm">Loading review details...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && review && (
            <div className="space-y-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyles(review.status)}`}
                >
                  {getStatusLabel(review.status)}
                </span>

                <span className="text-xs font-medium text-slate-500">
                  {review.submissionMethod === "admin"
                    ? "Admin-entered review"
                    : "Client-submitted review"}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      size={18}
                      fill={index < review.rating ? "currentColor" : "none"}
                      className={
                        index < review.rating
                          ? "text-amber-500"
                          : "text-slate-300"
                      }
                    />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-slate-700">
                    {review.rating}/5
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {review.comment}
                </p>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-400">
                    Displayed publicly as
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {review.displayName || "Anonymous"}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <FolderKanban size={17} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Associated project
                  </h3>
                </div>

                <div className="grid gap-5 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                  <DetailItem
                    label="Project reference"
                    value={project?.projectReference ?? "Not available"}
                  />
                  <DetailItem
                    label="Project title"
                    value={project?.title ?? "Not available"}
                  />
                  <DetailItem
                    label="Project status"
                    value={project?.status ?? "Not available"}
                  />
                  <DetailItem
                    label="Project ID"
                    value={
                      project?._id ??
                      (typeof review.projectId === "string"
                        ? review.projectId
                        : "Not available")
                    }
                  />
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <UserRound size={17} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Client information
                  </h3>
                </div>

                <div className="grid gap-5 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                  <DetailItem
                    label="Client name"
                    value={client?.fullName ?? "Not available"}
                  />
                  <DetailItem
                    label="Email address"
                    value={client?.email ?? "Not available"}
                  />
                  <DetailItem
                    label="Phone number"
                    value={client?.phone ?? "Not available"}
                  />
                  <DetailItem
                    label="Display preference"
                    value={review.displayPreference.replace("_", " ")}
                  />
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck size={17} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Consent and moderation
                  </h3>
                </div>

                <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-600">
                      Consent to publish
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        review.consentToPublish
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {review.consentToPublish ? "Granted" : "Not granted"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-600">
                      Featured on homepage
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {review.isFeatured ? "Yes" : "No"}
                    </span>
                  </div>

                  <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <DetailItem
                      label="Submitted by"
                      value={submittedBy?.fullName ?? (
                        review.submissionMethod === "client"
                          ? "Client"
                          : "Not available"
                      )}
                    />
                    <DetailItem
                      label="Moderated by"
                      value={moderatedBy?.fullName ?? "Not available"}
                    />
                    <DetailItem
                      label="Submitted at"
                      value={formatDate(review.submittedAt)}
                    />
                    <DetailItem
                      label="Moderated at"
                      value={formatDate(review.moderatedAt)}
                    />
                  </div>

                  {review.moderationNote && (
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Moderation note
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {review.moderationNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CalendarDays size={14} />
                <span>Last updated: {formatDate(review.updatedAt)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
