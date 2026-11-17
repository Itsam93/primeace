import {
  useEffect,
  useState,
  type FormEvent
} from "react";

import {
  AlertCircle,
  LoaderCircle,
  X
} from "lucide-react";

import { ApiError } from "../../../lib/api.js";

import {
  createAdminReview,
  getEligibleReviewProjects
} from "../services/review.service.js";

import type {
  ICreateAdminReviewInput,
  IEligibleReviewProject
} from "../types/review.type.js";

import type {
  ReviewDisplayPreference
} from "@primeace/shared";

interface CreateReviewModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClassName =
  "mb-1.5 block text-sm font-medium text-slate-700";

export default function CreateReviewModal({
  onClose,
  onCreated
}: CreateReviewModalProps) {
  const [projects, setProjects] = useState<IEligibleReviewProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comment, setComment] = useState("");
  const [displayPreference, setDisplayPreference] =
    useState<ReviewDisplayPreference>("full_name");
  const [consentToPublish, setConsentToPublish] = useState(false);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadProjects() {
      try {
        setLoadingProjects(true);
        setError("");

        const result = await getEligibleReviewProjects();

        if (!isActive) return;

        setProjects(result);
      } catch (err) {
        if (!isActive) return;

        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load eligible projects."
        );
      } finally {
        if (isActive) {
          setLoadingProjects(false);
        }
      }
    }

    void loadProjects();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedProject = projects.find(
    (project) => project._id === selectedProjectId
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!selectedProjectId) {
      setError("Please select a project.");
      return;
    }

    if (!comment.trim()) {
      setError("Please enter the client's review.");
      return;
    }

    if (!consentToPublish) {
      setError("Client consent to publish this review is required.");
      return;
    }

    const input: ICreateAdminReviewInput = {
      projectId: selectedProjectId,
      rating,
      comment: comment.trim(),
      displayPreference,
      consentToPublish: true
    };

    try {
      setSubmitting(true);

      await createAdminReview(input);

      onCreated();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create the review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Add Client Review
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Record genuine feedback received from a client.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="review-project" className={labelClassName}>
              Completed Project
            </label>

            {loadingProjects ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-500">
                <LoaderCircle size={16} className="animate-spin" />
                Loading eligible projects...
              </div>
            ) : (
              <select
                id="review-project"
                value={selectedProjectId}
                onChange={(event) =>
                  setSelectedProjectId(event.target.value)
                }
                disabled={submitting}
                className={inputClassName}
                required
              >
                <option value="">Select a project</option>

                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.projectReference} — {project.title}
                  </option>
                ))}
              </select>
            )}

            {!loadingProjects && projects.length === 0 && !error && (
              <p className="mt-2 text-sm text-slate-500">
                There are currently no eligible completed projects.
              </p>
            )}
          </div>

          {selectedProject && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Associated Client
              </p>

              <p className="mt-2 font-medium text-slate-900">
                {selectedProject.clientSnapshot.fullName}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {selectedProject.clientSnapshot.email}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="review-rating" className={labelClassName}>
              Client Rating
            </label>

            <select
              id="review-rating"
              value={rating}
              onChange={(event) =>
                setRating(Number(event.target.value) as 1 | 2 | 3 | 4 | 5)
              }
              disabled={submitting}
              className={inputClassName}
            >
              <option value={5}>5 — Excellent</option>
              <option value={4}>4 — Very Good</option>
              <option value={3}>3 — Good</option>
              <option value={2}>2 — Fair</option>
              <option value={1}>1 — Poor</option>
            </select>
          </div>

          <div>
            <label htmlFor="review-comment" className={labelClassName}>
              Client Review
            </label>

            <textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={submitting}
              rows={5}
              maxLength={3000}
              placeholder="Enter the feedback provided by the client..."
              className={`${inputClassName} resize-y`}
              required
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {comment.length}/3000 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="review-display-preference"
              className={labelClassName}
            >
              Public Display Name
            </label>

            <select
              id="review-display-preference"
              value={displayPreference}
              onChange={(event) =>
                setDisplayPreference(
                  event.target.value as ReviewDisplayPreference
                )
              }
              disabled={submitting}
              className={inputClassName}
            >
              <option value="full_name">Full Name</option>
              <option value="first_name">First Name Only</option>
              <option value="anonymous">Anonymous</option>
            </select>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={consentToPublish}
                onChange={(event) =>
                  setConsentToPublish(event.target.checked)
                }
                disabled={submitting}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              <span className="text-sm leading-6 text-slate-700">
                I confirm that the client has explicitly consented to this
                review being published on the PrimeAce website, including
                the selected display-name preference.
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingProjects ||
                projects.length === 0 ||
                !selectedProjectId ||
                !comment.trim() ||
                !consentToPublish
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && (
                <LoaderCircle size={16} className="animate-spin" />
              )}
              {submitting ? "Saving Review..." : "Submit for Moderation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
