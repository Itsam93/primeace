import { Star } from "lucide-react";
import type { IPublicReview } from "@primeace/shared";

interface ReviewCardProps {
  review: IPublicReview;
  featured?: boolean;
}

function ReviewCard({
  review,
  featured = false
}: ReviewCardProps) {
  const date = new Date(review.createdAt);

  const formattedDate = Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(date);

  return (
    <article
      className={
        featured
          ? "flex h-full flex-col justify-between border border-white/10 bg-[#07152F] p-7 text-white sm:p-10"
          : "flex h-full flex-col justify-between border border-slate-200 bg-white p-7 sm:p-8"
      }
    >
      <div>
        {/* Rating */}
        <div
          className="flex items-center gap-1"
          aria-label={`${review.rating} out of 5 stars`}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              size={16}
              fill={index < review.rating ? "currentColor" : "none"}
              className={
                index < review.rating
                  ? featured
                    ? "text-[#D7B474]"
                    : "text-[#1556D6]"
                  : featured
                    ? "text-white/25"
                    : "text-slate-300"
              }
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Review */}
        <p
          className={`mt-7 whitespace-pre-line leading-8 ${
            featured
              ? "text-lg text-slate-100 sm:text-xl"
              : "text-base text-slate-700"
          }`}
        >
          {review.comment}
        </p>
      </div>

      {/* Client information */}
      <div
        className={`mt-10 border-t pt-5 ${
          featured ? "border-white/15" : "border-slate-200"
        }`}
      >
        <p
          className={`font-semibold ${
            featured ? "text-white" : "text-[#07152F]"
          }`}
        >
          {review.displayName}
        </p>

        {formattedDate && (
          <p
            className={`mt-2 text-xs ${
              featured ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {formattedDate}
          </p>
        )}
      </div>
    </article>
  );
}

export default ReviewCard;
