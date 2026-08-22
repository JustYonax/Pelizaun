import { MessageSquareQuote, Star } from "lucide-react"
import type { Review } from "@/lib/types"
import { formatDate, initials } from "@/lib/format"

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display flex items-center gap-2 text-lg font-semibold sm:text-xl">
        <MessageSquareQuote className="text-primary size-5" />
        Reseñas
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {reviews.map((review) => (
          <article key={review.id} className="glass flex flex-col gap-3 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                {initials(review.author) || "?"}
              </div>
              <div className="flex min-w-0 flex-col">
                <p className="truncate text-sm font-semibold">{review.author}</p>
                <p className="text-muted-foreground text-[11px]">
                  {formatDate(review.createdAt)}
                </p>
              </div>
              {review.rating ? (
                <span className="text-[var(--warning)] ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-semibold tabular-nums">
                  <Star className="size-3.5 fill-current" />
                  {review.rating}
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground line-clamp-5 text-sm leading-relaxed">
              {review.content}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
