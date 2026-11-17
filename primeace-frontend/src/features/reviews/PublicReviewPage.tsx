import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";

import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Star
} from "lucide-react";

import { apiRequest } from "../../lib/api.js";

interface PublicReviewInvitation {
  invitationReference: string;
  expiresAt: string;
  project: {
    projectReference: string;
    title: string;
    clientName: string;
  };
}

interface PublicReviewSubmission {
  id: string;
  rating: number;
  status: string;
  submittedAt: string;
}

type PageStatus = "loading" | "ready" | "error" | "submitted";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "an unknown date";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function PublicReviewPage() {
  const { token } = useParams<{ token: string }>();

  const [invitation, setInvitation] =
    useState<PublicReviewInvitation | null>(null);

  const [status, setStatus] = useState<PageStatus>("loading");
  const [error, setError] = useState("");

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [displayPreference, setDisplayPreference] =
    useState<"full_name" | "first_name" | "anonymous">("full_name");
  const [consentToPublish, setConsentToPublish] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInvitation() {
      if (!token) {
        setError("This review invitation link is invalid.");
        setStatus("error");
        return;
      }

      try {
        const result = await apiRequest<PublicReviewInvitation>(
          `/review-invitations/public/${encodeURIComponent(token)}`
        );

        if (!isMounted) return;

        setInvitation(result);
        setStatus("ready");
      } catch (err) {
        if (!isMounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "This review invitation is unavailable or has expired."
        );

        setStatus("error");
      }
    }

    void loadInvitation();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("This review invitation link is invalid.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (!comment.trim()) {
      setError("Please enter your review.");
      return;
    }

    if (!consentToPublish) {
      setError("Please confirm whether your review may be published.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await apiRequest<PublicReviewSubmission>(
        `/review-invitations/public/${encodeURIComponent(token)}/submit`,
        {
          method: "POST",
          body: JSON.stringify({
            rating,
            comment: comment.trim(),
            displayPreference,
            consentToPublish
          })
        }
      );

      setStatus("submitted");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Your review could not be submitted. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6FA] px-5 py-12">
      <div className="w-full max-w-2xl">
        {/* Brand */}
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold tracking-tight text-[#07152F]">
            Prime<span className="text-[#1556D6]">Ace</span>
          </p>

          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Client Feedback
          </p>
        </div>

        <div className="border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {/* Loading */}
          {status === "loading" && (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <LoaderCircle
                size={32}
                className="animate-spin text-[#1556D6]"
              />

              <p className="mt-5 text-sm text-slate-500">
                Verifying your review invitation...
              </p>
            </div>
          )}

          {/* Invalid or expired invitation */}
          {status === "error" && (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertCircle size={27} />
              </div>

              <h1 className="mt-5 text-xl font-bold text-[#07152F]">
                Invitation unavailable
              </h1>

              <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
                {error}
              </p>

              <p className="mt-5 text-sm text-slate-500">
                If you believe this is an error, please contact PrimeAce.
              </p>
            </div>
          )}

          {/* Successful submission */}
          {status === "submitted" && (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={34} />
              </div>

              <h1 className="mt-6 text-2xl font-bold text-[#07152F]">
                Thank you for your feedback.
              </h1>

              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
                Your review has been submitted successfully. We appreciate
                you taking the time to share your experience with PrimeAce.
              </p>

              <p className="mt-5 text-xs text-slate-400">
                Your review will be reviewed before it appears publicly.
              </p>
            </div>
          )}

          {/* Review form */}
          {status === "ready" && invitation && (
            <>
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#1556D6]">
                  Share your experience
                </p>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#07152F]">
                  How was your experience?
                </h1>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Your feedback helps us improve our services and serve
                  our clients better.
                </p>
              </div>

              {/* Project information */}
              <div className="mb-8 border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Project details
                </p>

                <h2 className="mt-3 font-semibold text-[#07152F]">
                  {invitation.project.title}
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  Reference: {invitation.project.projectReference}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Client: {invitation.project.clientName}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  Invitation expires on {formatDate(invitation.expiresAt)}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold text-[#07152F]">
                    How would you rate our service?
                  </label>

                  <div
                    className="mt-4 flex items-center gap-3"
                    role="group"
                    aria-label="Select your rating"
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((value) => {
                      const activeRating = hoveredRating || rating;
                      const isActive = value <= activeRating;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          onMouseEnter={() => setHoveredRating(value)}
                          aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                          aria-pressed={rating === value}
                          className="transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#1556D6] focus:ring-offset-2"
                        >
                          <Star
                            size={34}
                            fill={isActive ? "currentColor" : "none"}
                            className={
                              isActive
                                ? "text-[#D7B474]"
                                : "text-slate-300"
                            }
                          />
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {rating === 0
                      ? "Select a rating from 1 to 5 stars."
                      : `${rating} out of 5 stars`}
                  </p>
                </div>

                {/* Comment */}
                <div>
                  <label
                    htmlFor="review-comment"
                    className="mb-2 block text-sm font-semibold text-[#07152F]"
                  >
                    Your review
                  </label>

                  <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={6}
                    maxLength={3000}
                    required
                    placeholder="Tell us about your experience working with PrimeAce..."
                    className="w-full resize-y border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1556D6]"
                  />

                  <p className="mt-2 text-right text-xs text-slate-400">
                    {comment.length}/3000 characters
                  </p>
                </div>

                {/* Display preference */}
                <div>
                  <label
                    htmlFor="display-preference"
                    className="mb-2 block text-sm font-semibold text-[#07152F]"
                  >
                    How should your name appear if your review is published?
                  </label>

                  <select
                    id="display-preference"
                    value={displayPreference}
                    onChange={(event) =>
                      setDisplayPreference(
                        event.target.value as
                          | "full_name"
                          | "first_name"
                          | "anonymous"
                      )
                    }
                    className="w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1556D6]"
                  >
                    <option value="full_name">My full name</option>
                    <option value="first_name">My first name only</option>
                    <option value="anonymous">Anonymous</option>
                  </select>
                </div>

                {/* Consent */}
                <label className="flex cursor-pointer items-start gap-3 border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={consentToPublish}
                    onChange={(event) =>
                      setConsentToPublish(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-[#1556D6]"
                  />

                  <span className="text-sm leading-6 text-slate-600">
                    I give PrimeAce permission to publish my review on its
                    website using the display preference selected above.
                    I understand that my review will be subject to moderation.
                  </span>
                </label>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0"
                    />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    rating === 0 ||
                    !comment.trim() ||
                    !consentToPublish
                  }
                  className="flex w-full items-center justify-center gap-2 bg-[#1556D6] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#1048B8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                      Submitting review...
                    </>
                  ) : (
                    "Submit review"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} PrimeAce. All rights reserved.
        </p>
      </div>
    </main>
  );
}

export default PublicReviewPage;
