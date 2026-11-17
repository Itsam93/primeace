import { useEffect, useState } from "react";

import ReviewCard from "./ReviewCard";
import { getFeaturedReviews } from "../services/reviewServices";
import type { IPublicReview } from "@primeace/shared";

type ReviewState = "loading" | "success" | "error";

function Reviews() {
  const [reviews, setReviews] = useState<IPublicReview[]>([]);
  const [status, setStatus] = useState<ReviewState>("loading");

  useEffect(() => {
    let isMounted = true;

    async function loadReviews() {
      try {
        const result = await getFeaturedReviews();

        if (!isMounted) return;

        setReviews(result);
        setStatus("success");
      } catch {
        if (!isMounted) return;

        setStatus("error");
      }
    }

    void loadReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredReview = reviews[0];

  // Do not render an empty reviews section.
  if (status === "success" && reviews.length === 0) {
    return null;
  }

  return (
    <section
      id="reviews"
      className="bg-[#F4F6FA] py-24 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section introduction */}
        <div className="mb-14 max-w-2xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#1556D6]">
            Client Reviews
          </p>

          <h2 className="text-4xl font-bold leading-tight tracking-tight text-[#07152F] sm:text-5xl">
            What our clients say.
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600">
            Feedback from clients who have worked with PrimeAce.
          </p>
        </div>

        {/* Loading state */}
        {status === "loading" && (
          <div
            className="grid gap-5 lg:grid-cols-2"
            aria-label="Loading client reviews"
            aria-busy="true"
          >
            <div className="min-h-80 animate-pulse bg-slate-200" />

            <div className="grid gap-5">
              <div className="min-h-36 animate-pulse bg-slate-200" />
              <div className="min-h-36 animate-pulse bg-slate-200" />
            </div>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <p
            className="border border-slate-200 bg-white px-6 py-8 text-sm text-slate-600"
            role="status"
          >
            Client reviews are temporarily unavailable.
          </p>
        )}

        {/* Reviews */}
        {status === "success" && featuredReview && (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <ReviewCard
              review={featuredReview}
              featured
            />

            {reviews.length > 1 && (
              <div className="grid gap-5">
                {reviews.slice(1).map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default Reviews;
