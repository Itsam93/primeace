import {
  useCallback,
  useEffect,
  useState
} from "react";

import type { FormEvent } from "react";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquareQuote,
  Plus,
  RefreshCw,
  Search,
  Star,
  Mail
} from "lucide-react";

import {
  ReviewInvitationStatus,
  ReviewStatus
} from "@primeace/shared";

import { ApiError } from "../../lib/api.js";

import CreateReviewModal from "./components/CreateReviewModal.js";
import ReviewDetailsModal from "./components/ReviewDetailsModal.js";
import CreateReviewInvitationModal from "./components/CreateReviewInvitationModal.js";
import ReviewInvitationDetailsModal from "./components/ReviewInvitationDetailsModal.js";

import {
  getReviews,
  moderateReview
} from "./services/review.service.js";

import {
  getReviewInvitations
} from "./services/reviewInvitation.service.js";

import type {
  IAdminReview,
  IModerateReviewInput,
  IReviewListParams
} from "./types/review.type.js";

import type {
  IReviewInvitation,
  IReviewInvitationListParams
} from "./types/reviewInvitation.type.js";

const PAGE_SIZE = 10;

type SubmissionFilter = "" | "client" | "admin";
type ActiveTab = "reviews" | "invitations";

function getReviewStatusStyles(status: ReviewStatus): string {
  switch (status) {
    case ReviewStatus.APPROVED:
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case ReviewStatus.REJECTED:
      return "bg-red-50 text-red-700 ring-red-600/20";

    case ReviewStatus.HIDDEN:
      return "bg-slate-100 text-slate-600 ring-slate-500/20";

    case ReviewStatus.PENDING:
    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
}

function getInvitationStatusStyles(
  status: ReviewInvitationStatus
): string {
  switch (status) {
    case ReviewInvitationStatus.SUBMITTED:
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case ReviewInvitationStatus.EXPIRED:
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case ReviewInvitationStatus.REVOKED:
      return "bg-red-50 text-red-700 ring-red-600/20";

    case ReviewInvitationStatus.PENDING:
    default:
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function getProjectDetails(
  project: IAdminReview["projectId"]
): { reference: string; title: string } {
  if (typeof project === "string") {
    return {
      reference: "Project unavailable",
      title: "Project details could not be loaded"
    };
  }

  return {
    reference: project.projectReference,
    title: project.title
  };
}

function getClientName(
  client: IAdminReview["clientId"]
): string {
  if (typeof client === "string") {
    return "Client details unavailable";
  }

  return client.fullName;
}

function getSubmissionLabel(
  method: IAdminReview["submissionMethod"]
): string {
  return method === "admin" ? "Admin entered" : "Client submitted";
}

function getInvitationProject(
  invitation: IReviewInvitation
): { reference: string; title: string } {
  if (typeof invitation.projectId === "string") {
    return {
      reference: "Project unavailable",
      title: "Project details could not be loaded"
    };
  }

  return {
    reference: invitation.projectId.projectReference,
    title: invitation.projectId.title
  };
}

function getInvitationClient(
  invitation: IReviewInvitation
): { name: string; email: string } {
  if (typeof invitation.clientId === "string") {
    return {
      name: "Client details unavailable",
      email: "—"
    };
  }

  return {
    name: invitation.clientId.fullName,
    email: invitation.clientId.email
  };
}

function RatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star
        size={14}
        className="fill-amber-400 text-amber-400"
      />

      <span className="font-semibold text-slate-700">
        {rating}/5
      </span>
    </div>
  );
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("reviews");

  // Review state
  const [reviews, setReviews] = useState<IAdminReview[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewRefreshing, setReviewRefreshing] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<ReviewStatus | "">("");
  const [submissionMethod, setSubmissionMethod] =
    useState<SubmissionFilter>("");

  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);

  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [moderationError, setModerationError] = useState("");

  const [showCreateReviewModal, setShowCreateReviewModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  // Invitation state
  const [invitations, setInvitations] = useState<IReviewInvitation[]>([]);
  const [invitationLoading, setInvitationLoading] = useState(true);
  const [invitationRefreshing, setInvitationRefreshing] = useState(false);
  const [invitationError, setInvitationError] = useState("");

  const [invitationSearchInput, setInvitationSearchInput] = useState("");
  const [invitationSearch, setInvitationSearch] = useState("");
  const [invitationStatus, setInvitationStatus] =
    useState<ReviewInvitationStatus | "">("");

  const [invitationPage, setInvitationPage] = useState(1);
  const [invitationTotal, setInvitationTotal] = useState(0);
  const [invitationTotalPages, setInvitationTotalPages] = useState(0);

  const [showCreateInvitationModal, setShowCreateInvitationModal] =
    useState(false);

  const [selectedInvitationId, setSelectedInvitationId] =
    useState<string | null>(null);

  const loadReviews = useCallback(
    async (showRefreshIndicator = false) => {
      try {
        setReviewError("");

        if (showRefreshIndicator) {
          setReviewRefreshing(true);
        } else {
          setReviewLoading(true);
        }

        const params: IReviewListParams = {
          page: reviewPage,
          limit: PAGE_SIZE
        };

        if (search) params.search = search;
        if (status) params.status = status;
        if (submissionMethod) params.submissionMethod = submissionMethod;

        const result = await getReviews(params);

        setReviews(result.reviews);
        setReviewTotal(result.pagination.total);
        setReviewTotalPages(result.pagination.totalPages);
      } catch (err) {
        setReviewError(
          err instanceof ApiError
            ? err.message
            : "Unable to load reviews. Please try again."
        );
      } finally {
        setReviewLoading(false);
        setReviewRefreshing(false);
      }
    },
    [reviewPage, search, status, submissionMethod]
  );

  const loadInvitations = useCallback(
    async (showRefreshIndicator = false) => {
      try {
        setInvitationError("");

        if (showRefreshIndicator) {
          setInvitationRefreshing(true);
        } else {
          setInvitationLoading(true);
        }

        const params: IReviewInvitationListParams = {
          page: invitationPage,
          limit: PAGE_SIZE
        };

        if (invitationSearch) params.search = invitationSearch;
        if (invitationStatus) params.status = invitationStatus;

        const result = await getReviewInvitations(params);

        setInvitations(result.invitations);
        setInvitationTotal(result.pagination.total);
        setInvitationTotalPages(result.pagination.totalPages);
      } catch (err) {
        setInvitationError(
          err instanceof ApiError
            ? err.message
            : "Unable to load review invitations. Please try again."
        );
      } finally {
        setInvitationLoading(false);
        setInvitationRefreshing(false);
      }
    },
    [invitationPage, invitationSearch, invitationStatus]
  );

  useEffect(() => {
    if (activeTab === "reviews") {
      void loadReviews();
    }
  }, [activeTab, loadReviews]);

  useEffect(() => {
    if (activeTab === "invitations") {
      void loadInvitations();
    }
  }, [activeTab, loadInvitations]);

  const handleReviewSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextSearch = searchInput.trim();

    if (nextSearch === search) return;

    setReviewPage(1);
    setSearch(nextSearch);
  };

  const handleInvitationSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextSearch = invitationSearchInput.trim();

    if (nextSearch === invitationSearch) return;

    setInvitationPage(1);
    setInvitationSearch(nextSearch);
  };

  const handleReviewStatusChange = (value: string) => {
    setReviewPage(1);
    setStatus(value as ReviewStatus | "");
  };

  const handleSubmissionChange = (value: string) => {
    setReviewPage(1);
    setSubmissionMethod(value as SubmissionFilter);
  };

  const clearReviewFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setSubmissionMethod("");
    setReviewPage(1);
  };

  const clearInvitationFilters = () => {
    setInvitationSearchInput("");
    setInvitationSearch("");
    setInvitationStatus("");
    setInvitationPage(1);
  };

  const handleModeration = async (
    reviewId: string,
    input: IModerateReviewInput
  ) => {
    try {
      setModerationError("");
      setModeratingId(reviewId);

      await moderateReview(reviewId, input);
      await loadReviews(true);
    } catch (err) {
      setModerationError(
        err instanceof ApiError
          ? err.message
          : "Unable to update this review. Please try again."
      );
    } finally {
      setModeratingId(null);
    }
  };

  const hasActiveReviewFilters =
    Boolean(search) || Boolean(status) || Boolean(submissionMethod);

  const hasActiveInvitationFilters =
    Boolean(invitationSearch) || Boolean(invitationStatus);

  const reviewFirstRecord =
    reviewTotal === 0 ? 0 : (reviewPage - 1) * PAGE_SIZE + 1;

  const reviewLastRecord = Math.min(reviewPage * PAGE_SIZE, reviewTotal);

  const invitationFirstRecord =
    invitationTotal === 0 ? 0 : (invitationPage - 1) * PAGE_SIZE + 1;

  const invitationLastRecord = Math.min(
    invitationPage * PAGE_SIZE,
    invitationTotal
  );

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <MessageSquareQuote size={16} />
            Management
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reviews
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage client feedback, review submissions and invitations.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {activeTab === "reviews" ? (
            <button
              type="button"
              onClick={() => setShowCreateReviewModal(true)}
              disabled={Boolean(moderatingId)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={16} />
              Add Review
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateInvitationModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={16} />
              Create Invitation
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              activeTab === "reviews"
                ? void loadReviews(true)
                : void loadInvitations(true)
            }
            disabled={
              activeTab === "reviews"
                ? reviewLoading || reviewRefreshing || Boolean(moderatingId)
                : invitationLoading || invitationRefreshing
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                (activeTab === "reviews" ? reviewRefreshing : invitationRefreshing)
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition ${
            activeTab === "reviews"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquareQuote size={16} />
          Reviews
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invitations")}
          className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition ${
            activeTab === "invitations"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Mail size={16} />
          Invitations
        </button>
      </div>

      {activeTab === "reviews" ? (
        <>
          {/* Review summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">
              Total reviews
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {reviewTotal.toLocaleString("en-NG")}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Matching the current filters
            </p>
          </div>

          {/* Review filters */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Filter reviews
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Search review content or display name and narrow results by status or submission method.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <form
                onSubmit={handleReviewSearch}
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
                    placeholder="Search review text or display name..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Search
                </button>
              </form>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={status}
                  onChange={(event) =>
                    handleReviewStatusChange(event.target.value)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="">All statuses</option>
                  <option value={ReviewStatus.PENDING}>Pending</option>
                  <option value={ReviewStatus.APPROVED}>Approved</option>
                  <option value={ReviewStatus.REJECTED}>Rejected</option>
                  <option value={ReviewStatus.HIDDEN}>Hidden</option>
                </select>

                <select
                  value={submissionMethod}
                  onChange={(event) =>
                    handleSubmissionChange(event.target.value)
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="">All submissions</option>
                  <option value="client">Client submitted</option>
                  <option value="admin">Admin entered</option>
                </select>

                {hasActiveReviewFilters && (
                  <button
                    type="button"
                    onClick={clearReviewFilters}
                    className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {reviewError && (
            <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600" />

                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Unable to load reviews
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {reviewError}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void loadReviews()}
                disabled={reviewLoading}
                className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Try again
              </button>
            </div>
          )}

          {moderationError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />

              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  Moderation failed
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {moderationError}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModerationError("")}
                className="text-xs font-semibold text-red-700 hover:text-red-900"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Reviews table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Review submissions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Review and moderation records
                </p>
              </div>

              <span className="text-xs font-medium text-slate-500">
                {reviewTotal.toLocaleString("en-NG")} records
              </span>
            </div>

            {reviewLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <RefreshCw size={18} className="animate-spin text-blue-600" />
                  Loading reviews...
                </div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <MessageSquareQuote size={22} className="text-slate-400" />
                </div>

                <h3 className="font-semibold text-slate-900">
                  No reviews found
                </h3>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  {hasActiveReviewFilters
                    ? "No reviews match your current filters. Try changing or clearing them."
                    : "There are no review submissions to display yet."}
                </p>

                {hasActiveReviewFilters && (
                  <button
                    type="button"
                    onClick={clearReviewFilters}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px] text-left">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Client / Project</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Review</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Rating</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Submission</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Featured</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Submitted</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {reviews.map((review) => {
                        const project = getProjectDetails(review.projectId);
                        const isModerating = moderatingId === review._id;

                        return (
                          <tr key={review._id} className="transition hover:bg-slate-50/70">
                            <td className="px-5 py-4">
                              <p className="text-sm font-semibold text-slate-800">
                                {getClientName(review.clientId)}
                              </p>
                              <p className="mt-1 text-xs font-medium text-blue-600">
                                {project.reference}
                              </p>
                              <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
                                {project.title}
                              </p>
                            </td>

                            <td className="max-w-sm px-5 py-4">
                              <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                                {review.comment}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Display: {review.displayPreference.replace("_", " ")}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <RatingDisplay rating={review.rating} />
                            </td>

                            <td className="px-5 py-4">
                              <span className="text-sm text-slate-600">
                                {getSubmissionLabel(review.submissionMethod)}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getReviewStatusStyles(review.status)}`}>
                                {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              {review.isFeatured ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                                  <Star size={14} className="fill-amber-400 text-amber-400" />
                                  Featured
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                              {formatDate(review.submittedAt)}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex min-w-36 flex-col items-start gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedReviewId(review._id)}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                                >
                                  <Eye size={14} />
                                  View details
                                </button>

                                {review.status !== ReviewStatus.APPROVED && (
                                  <button
                                    type="button"
                                    disabled={Boolean(moderatingId)}
                                    onClick={() => void handleModeration(review._id, {
                                      status: ReviewStatus.APPROVED,
                                      isFeatured: false
                                    })}
                                    className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                )}

                                {review.status !== ReviewStatus.REJECTED && (
                                  <button
                                    type="button"
                                    disabled={Boolean(moderatingId)}
                                    onClick={() => void handleModeration(review._id, {
                                      status: ReviewStatus.REJECTED,
                                      isFeatured: false
                                    })}
                                    className="text-xs font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                )}

                                {review.status !== ReviewStatus.HIDDEN && (
                                  <button
                                    type="button"
                                    disabled={Boolean(moderatingId)}
                                    onClick={() => void handleModeration(review._id, {
                                      status: ReviewStatus.HIDDEN,
                                      isFeatured: false
                                    })}
                                    className="text-xs font-semibold text-slate-600 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Hide
                                  </button>
                                )}

                                {review.status === ReviewStatus.APPROVED && (
                                  <button
                                    type="button"
                                    disabled={Boolean(moderatingId)}
                                    onClick={() => void handleModeration(review._id, {
                                      status: ReviewStatus.APPROVED,
                                      isFeatured: !review.isFeatured
                                    })}
                                    className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {review.isFeatured ? "Unfeature" : "Feature"}
                                  </button>
                                )}

                                {isModerating && (
                                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                    <RefreshCw size={12} className="animate-spin" />
                                    Updating...
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

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {reviewFirstRecord}–{reviewLastRecord}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {reviewTotal}
                    </span>{" "}
                    reviews
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={reviewPage <= 1 || reviewLoading || Boolean(moderatingId)}
                      onClick={() => setReviewPage((current) => current - 1)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <span className="px-2 text-sm font-medium text-slate-600">
                      {reviewPage} / {Math.max(reviewTotalPages, 1)}
                    </span>

                    <button
                      type="button"
                      disabled={reviewPage >= reviewTotalPages || reviewLoading || reviewTotalPages === 0 || Boolean(moderatingId)}
                      onClick={() => setReviewPage((current) => current + 1)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Invitation summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">
              Total invitations
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {invitationTotal.toLocaleString("en-NG")}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Matching the current filters
            </p>
          </div>

          {/* Invitation filters */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Filter invitations
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Search by invitation reference, project or client details.
            </p>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row">
              <form onSubmit={handleInvitationSearch} className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={invitationSearchInput}
                    onChange={(event) => setInvitationSearchInput(event.target.value)}
                    placeholder="Search invitation, project or client..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Search
                </button>
              </form>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={invitationStatus}
                  onChange={(event) => {
                    setInvitationPage(1);
                    setInvitationStatus(event.target.value as ReviewInvitationStatus | "");
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="">All statuses</option>
                  <option value={ReviewInvitationStatus.PENDING}>Pending</option>
                  <option value={ReviewInvitationStatus.SUBMITTED}>Submitted</option>
                  <option value={ReviewInvitationStatus.EXPIRED}>Expired</option>
                  <option value={ReviewInvitationStatus.REVOKED}>Revoked</option>
                </select>

                {hasActiveInvitationFilters && (
                  <button
                    type="button"
                    onClick={clearInvitationFilters}
                    className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {invitationError && (
            <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600" />

                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Unable to load invitations
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {invitationError}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void loadInvitations()}
                disabled={invitationLoading}
                className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Try again
              </button>
            </div>
          )}

          {/* Invitations table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Review invitations
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Invitation and email delivery records
                </p>
              </div>

              <span className="text-xs font-medium text-slate-500">
                {invitationTotal.toLocaleString("en-NG")} records
              </span>
            </div>

            {invitationLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <RefreshCw size={18} className="animate-spin text-blue-600" />
                  Loading invitations...
                </div>
              </div>
            ) : invitations.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Mail size={22} className="text-slate-400" />
                </div>

                <h3 className="font-semibold text-slate-900">
                  No invitations found
                </h3>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  {hasActiveInvitationFilters
                    ? "No invitations match your current filters. Try changing or clearing them."
                    : "There are no review invitations yet."}
                </p>

                {hasActiveInvitationFilters && (
                  <button
                    type="button"
                    onClick={clearInvitationFilters}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Invitation</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Client</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Project</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Email sent</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Expires</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {invitations.map((invitation) => {
                        const project = getInvitationProject(invitation);
                        const client = getInvitationClient(invitation);

                        return (
                          <tr key={invitation._id} className="transition hover:bg-slate-50/70">
                            <td className="px-5 py-4">
                              <p className="text-sm font-semibold text-slate-800">
                                {invitation.invitationReference}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm font-semibold text-slate-800">
                                {client.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {client.email}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-xs font-medium text-blue-600">
                                {project.reference}
                              </p>
                              <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
                                {project.title}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getInvitationStatusStyles(invitation.status)}`}>
                                {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                              {formatDate(invitation.sentAt)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                              {formatDate(invitation.expiresAt)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                              {formatDate(invitation.createdAt)}
                            </td>

                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() => setSelectedInvitationId(invitation._id)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                              >
                                <Eye size={14} />
                                View details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {invitationFirstRecord}–{invitationLastRecord}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">
                      {invitationTotal}
                    </span>{" "}
                    invitations
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={invitationPage <= 1 || invitationLoading}
                      onClick={() => setInvitationPage((current) => current - 1)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <span className="px-2 text-sm font-medium text-slate-600">
                      {invitationPage} / {Math.max(invitationTotalPages, 1)}
                    </span>

                    <button
                      type="button"
                      disabled={invitationPage >= invitationTotalPages || invitationLoading || invitationTotalPages === 0}
                      onClick={() => setInvitationPage((current) => current + 1)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Create review modal */}
      {showCreateReviewModal && (
        <CreateReviewModal
          onClose={() => setShowCreateReviewModal(false)}
          onCreated={() => {
            setShowCreateReviewModal(false);
            setReviewPage(1);
            setSearch("");
            setSearchInput("");
            setStatus("");
            setSubmissionMethod("");
          }}
        />
      )}

      {/* Review details modal */}
      {selectedReviewId && (
        <ReviewDetailsModal
          reviewId={selectedReviewId}
          onClose={() => setSelectedReviewId(null)}
        />
      )}

      {/* Create invitation modal */}
      {showCreateInvitationModal && (
        <CreateReviewInvitationModal
          onClose={() => setShowCreateInvitationModal(false)}
          onCreated={() => {
            setShowCreateInvitationModal(false);
            setInvitationPage(1);
            setInvitationSearch("");
            setInvitationSearchInput("");
            setInvitationStatus("");
          }}
        />
      )}

      {/* Invitation details modal */}
      {selectedInvitationId && (
        <ReviewInvitationDetailsModal
          invitationId={selectedInvitationId}
          onClose={() => setSelectedInvitationId(null)}
          onUpdated={() => {
            void loadInvitations(true);
          }}
        />
      )}
    </div>
  );
}