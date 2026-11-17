import { useEffect, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  LoaderCircle,
  Mail,
  RefreshCw,
  ShieldBan,
  X
} from "lucide-react";

import { ApiError } from "../../../lib/api.js";

import {
  getReviewInvitationById,
  resendReviewInvitation,
  renewReviewInvitation,
  revokeReviewInvitation
} from "../services/reviewInvitation.service.js";

import type {
  IReviewInvitation,
  IReviewInvitationEmailResult
} from "../types/reviewInvitation.type.js";

interface ReviewInvitationDetailsModalProps {
  invitationId: string;
  onClose: () => void;
  onUpdated: () => void;
}

type ConfirmationAction = "renew" | "revoke" | null;

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getStatusClasses(status: string): string {
  switch (status) {
    case "pending":
      return "bg-blue-50 text-blue-700";

    case "submitted":
      return "bg-green-50 text-green-700";

    case "expired":
      return "bg-amber-50 text-amber-700";

    case "revoked":
      return "bg-red-50 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getProjectReference(
  projectId: IReviewInvitation["projectId"]
): string {
  return typeof projectId === "string"
    ? projectId
    : projectId.projectReference;
}

function getProjectTitle(
  projectId: IReviewInvitation["projectId"]
): string {
  return typeof projectId === "string"
    ? "Project details unavailable"
    : projectId.title;
}

function getClientName(
  clientId: IReviewInvitation["clientId"]
): string {
  return typeof clientId === "string"
    ? "Client details unavailable"
    : clientId.fullName;
}

function getClientEmail(
  clientId: IReviewInvitation["clientId"]
): string {
  return typeof clientId === "string"
    ? "—"
    : clientId.email;
}

function ReviewInvitationDetailsModal({
  invitationId,
  onClose,
  onUpdated
}: ReviewInvitationDetailsModalProps) {
  const [invitation, setInvitation] =
    useState<IReviewInvitation | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<
    "resend" | "renew" | "revoke" | null
  >(null);

  const [confirmation, setConfirmation] =
    useState<ConfirmationAction>(null);

  const [emailResult, setEmailResult] =
    useState<IReviewInvitationEmailResult | null>(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInvitation() {
      try {
        const data = await getReviewInvitationById(invitationId);

        if (isMounted) {
          setInvitation(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load invitation details."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInvitation();

    return () => {
      isMounted = false;
    };
  }, [invitationId]);

  const isSubmitted = invitation?.status === "submitted";
  const isRevoked = invitation?.status === "revoked";
  const canRenew = Boolean(invitation && !isSubmitted);
  const canRevoke = Boolean(invitation && !isSubmitted && !isRevoked);

  const canResend = Boolean(
    invitation &&
    invitation.status === "pending" &&
    !invitation.sentAt
  );

  async function handleResend() {
    setError("");
    setSuccessMessage("");
    setEmailResult(null);
    setActiveAction("resend");

    try {
      const response = await resendReviewInvitation(invitationId);

      setEmailResult(response.email);
      setSuccessMessage(response.email.message);

      const updatedInvitation =
        await getReviewInvitationById(invitationId);

      setInvitation(updatedInvitation);
      onUpdated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to retry invitation email delivery."
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleRenew() {
    setError("");
    setSuccessMessage("");
    setEmailResult(null);
    setActiveAction("renew");

    try {
      const response = await renewReviewInvitation(invitationId);

      setInvitation(response.invitation);
      setEmailResult(response.email);
      setSuccessMessage(response.email.message);
      setConfirmation(null);

      onUpdated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to renew the review invitation."
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleRevoke() {
    setError("");
    setSuccessMessage("");
    setEmailResult(null);
    setActiveAction("revoke");

    try {
      const updatedInvitation =
        await revokeReviewInvitation(invitationId);

      setInvitation(updatedInvitation);
      setSuccessMessage("Review invitation revoked successfully.");
      setConfirmation(null);

      onUpdated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to revoke the review invitation."
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleConfirmedAction() {
    if (confirmation === "renew") {
      await handleRenew();
    } else if (confirmation === "revoke") {
      await handleRevoke();
    }
  }

  function handleClose() {
    if (!activeAction) {
      onClose();
    }
  }

  const projectReference = invitation
    ? getProjectReference(invitation.projectId)
    : "";

  const projectTitle = invitation
    ? getProjectTitle(invitation.projectId)
    : "";

  const clientName = invitation
    ? getClientName(invitation.clientId)
    : "";

  const clientEmail = invitation
    ? getClientEmail(invitation.clientId)
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitation-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h2
              id="invitation-details-title"
              className="text-lg font-semibold text-gray-900"
            >
              Invitation Details
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review invitation information and delivery status.
            </p>
          </div>

          {!activeAction && (
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

        <div className="space-y-5 p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading invitation details...
            </div>
          ) : invitation ? (
            <>
              <section className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Invitation reference
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {invitation.invitationReference}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusClasses(invitation.status)}`}
                  >
                    {invitation.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(invitation.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Last updated</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(invitation.updatedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Expires</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(invitation.expiresAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Email sent</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(invitation.sentAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Review submitted</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(invitation.submittedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Revoked</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(invitation.revokedAt)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Project information
                </h3>

                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      Project reference
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {projectReference}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Project title</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {projectTitle}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Client information
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500">Client name</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {clientName}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Email address</p>
                    <p className="mt-1 break-all text-sm font-medium text-gray-900">
                      {clientEmail}
                    </p>
                  </div>
                </div>
              </section>

              {invitation.reviewId && (
                <section className="rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Associated review
                  </h3>

                  <p className="mt-2 text-sm text-gray-600">
                    {typeof invitation.reviewId === "string"
                      ? `Review ID: ${invitation.reviewId}`
                      : `Rating: ${invitation.reviewId.rating}/5`}
                  </p>

                  {typeof invitation.reviewId !== "string" && (
                    <p className="mt-1 text-sm capitalize text-gray-600">
                      Status: {invitation.reviewId.status}
                    </p>
                  )}
                </section>
              )}

              {emailResult && (
                <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2">
                    {emailResult.sent ? (
                      <CheckCircle2
                        size={18}
                        className="text-green-600"
                      />
                    ) : (
                      <AlertCircle
                        size={18}
                        className="text-amber-600"
                      />
                    )}

                    <h3 className="text-sm font-semibold text-gray-900">
                      Email delivery result
                    </h3>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {emailResult.message}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Sent at: {formatDate(emailResult.sentAt)}
                  </p>
                </section>
              )}

              {confirmation && (
                <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {confirmation === "renew"
                          ? "Renew this invitation?"
                          : "Revoke this invitation?"}
                      </h3>

                      <p className="mt-1 text-sm text-gray-700">
                        {confirmation === "renew"
                          ? "The existing invitation link will become invalid. A new seven-day invitation will be issued and sent to the client."
                          : "The invitation link will no longer be usable. Any unsent invitation email will be cancelled."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmation(null)}
                      disabled={Boolean(activeAction)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleConfirmedAction()}
                      disabled={Boolean(activeAction)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                        confirmation === "revoke"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {activeAction && (
                        <LoaderCircle size={16} className="animate-spin" />
                      )}
                      {confirmation === "renew"
                        ? "Renew invitation"
                        : "Revoke invitation"}
                    </button>
                  </div>
                </section>
              )}

              <section className="border-t border-gray-200 pt-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  Invitation actions
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {canResend && (
                    <button
                      type="button"
                      onClick={() => void handleResend()}
                      disabled={Boolean(activeAction)}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {activeAction === "resend" ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Mail size={16} />
                      )}
                      Retry email
                    </button>
                  )}

                  {canRenew && (
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccessMessage("");
                        setConfirmation("renew");
                      }}
                      disabled={Boolean(activeAction)}
                      className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw size={16} />
                      Renew invitation
                    </button>
                  )}

                  {canRevoke && (
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccessMessage("");
                        setConfirmation("revoke");
                      }}
                      disabled={Boolean(activeAction)}
                      className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ShieldBan size={16} />
                      Revoke invitation
                    </button>
                  )}
                </div>

                {isSubmitted && (
                  <p className="mt-3 text-sm text-gray-500">
                    This invitation has already been submitted. It cannot be
                    renewed or revoked.
                  </p>
                )}

                {isRevoked && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={16} />
                    This invitation has been revoked. You can renew it to
                    issue a replacement link.
                  </p>
                )}

                {!canResend &&
                  invitation.status === "pending" &&
                  invitation.sentAt && (
                    <p className="mt-3 text-sm text-gray-500">
                      The invitation email has already been sent.
                    </p>
                  )}
              </section>
            </>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle
                size={28}
                className="mx-auto text-red-500"
              />
              <p className="mt-3 text-sm text-gray-600">
                Invitation details could not be loaded.
              </p>
            </div>
          )}

          <div className="flex justify-end border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={Boolean(activeAction)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewInvitationDetailsModal;
