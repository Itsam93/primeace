import { useEffect, useState, type FormEvent } from "react";

import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Mail,
  X
} from "lucide-react";

import { ApiError } from "../../../lib/api.js";

import { getEligibleReviewProjects } from "../services/review.service.js";
import { createReviewInvitation } from "../services/reviewInvitation.service.js";

import type { IEligibleReviewProject } from "../types/review.type.js";
import type { IReviewInvitationDeliveryResponse } from "../types/reviewInvitation.type.js";

interface CreateReviewInvitationModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateReviewInvitationModal({
  onClose,
  onCreated
}: CreateReviewInvitationModalProps) {
  const [projects, setProjects] = useState<IEligibleReviewProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] =
    useState<IReviewInvitationDeliveryResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        const eligibleProjects = await getEligibleReviewProjects();

        if (isMounted) {
          setProjects(eligibleProjects);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load eligible projects."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingProjects(false);
        }
      }
    }

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedProject = projects.find(
    (project) => project._id === selectedProjectId
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      setError("Please select a project.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await createReviewInvitation({
        projectId: selectedProjectId
      });

      setResult(response);
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create the review invitation."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (!isSubmitting) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-invitation-title"
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2
              id="create-invitation-title"
              className="text-lg font-semibold text-gray-900"
            >
              Create Review Invitation
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Invite a client to review a completed project.
            </p>
          </div>

          {!isSubmitting && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close modal"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-6">
          {result ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                {result.email.sent ? (
                  <CheckCircle2
                    size={22}
                    className="mt-0.5 shrink-0 text-green-600"
                  />
                ) : (
                  <AlertCircle
                    size={22}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                )}

                <div>
                  <h3 className="font-medium text-gray-900">
                    {result.email.sent
                      ? "Invitation created and email sent"
                      : "Invitation created, but email delivery failed"}
                  </h3>

                  <p className="mt-1 text-sm text-gray-600">
                    {result.email.message}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Invitation reference
                </p>
                <p className="mt-1 font-semibold text-gray-900">
                  {result.invitation.invitationReference}
                </p>

                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Project
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedProject?.projectReference ?? "Selected project"}
                </p>

                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Email recipient
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedProject?.clientSnapshot.email ?? "Client email"}
                </p>
              </div>

              {!result.email.sent && (
                <p className="text-sm text-gray-600">
                  You can retry email delivery from the invitation details.
                  The invitation itself has already been created.
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="invitation-project"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Completed project
                </label>

                {isLoadingProjects ? (
                  <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                    <LoaderCircle size={17} className="animate-spin" />
                    Loading eligible projects...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    No eligible projects are currently available for review
                    invitations.
                  </div>
                ) : (
                  <select
                    id="invitation-project"
                    value={selectedProjectId}
                    onChange={(event) => {
                      setSelectedProjectId(event.target.value);
                      setError("");
                    }}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select a project</option>

                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.projectReference} — {project.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedProject && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Client details
                  </h3>

                  <div className="mt-3 space-y-2 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">
                        {selectedProject.clientSnapshot.fullName}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Email address</p>
                      <p className="font-medium text-gray-900">
                        {selectedProject.clientSnapshot.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <Mail
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />
                  <p className="text-sm text-blue-800">
                    The invitation link will be emailed to the client and
                    will remain valid for seven days. If delivery fails,
                    you can retry it without creating another invitation.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isLoadingProjects ||
                    projects.length === 0 ||
                    !selectedProjectId ||
                    isSubmitting
                  }
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && (
                    <LoaderCircle size={17} className="animate-spin" />
                  )}
                  {isSubmitting ? "Creating..." : "Create Invitation"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateReviewInvitationModal;
