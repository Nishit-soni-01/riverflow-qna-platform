import Link from "next/link";
import { Check, Eye, ThumbsUp } from "lucide-react";
import type { Question } from "@/lib/questions";
import { TimeAgo } from "@/components/shared/time-ago";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en", { notation: "compact" });

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AnswerBadge({ answers, solved }: { answers: number; solved: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
        solved
          ? "bg-primary text-primary-foreground"
          : answers > 0
            ? "border border-primary/60 text-primary"
            : "text-muted-foreground"
      )}
    >
      {solved && <Check className="size-3" aria-hidden />}
      {answers} {answers === 1 ? "answer" : "answers"}
      {solved && <span className="sr-only">, solved</span>}
    </span>
  );
}

export function QuestionCard({ q }: { q: Question }) {
  return (
    <article className="flex gap-5 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5">
      {/* Stats column (desktop) */}
      <div className="hidden w-24 shrink-0 flex-col items-end gap-2 text-sm text-muted-foreground sm:flex">
        <span className="flex items-center gap-1.5">
          <ThumbsUp className="size-3.5" aria-hidden />
          <b className="font-semibold text-foreground">{compact.format(q.votes)}</b>
          votes
        </span>
        <AnswerBadge answers={q.answers} solved={q.solved} />
        <span className="flex items-center gap-1.5">
          <Eye className="size-3.5" aria-hidden />
          {compact.format(q.views)} views
        </span>
      </div>

      <div className="min-w-0 flex-1 space-y-2.5">
        <h2 className="text-base font-semibold leading-snug sm:text-lg">
          <Link
            href={`/questions/${q.$id}`}
            className="line-clamp-2 underline-offset-4 hover:text-primary hover:underline"
          >
            {q.title}
          </Link>
        </h2>
        <p className="line-clamp-2 text-sm text-muted-foreground">{q.excerpt}</p>

        {/* Stats row (mobile) */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:hidden">
          <span className="flex items-center gap-1">
            <ThumbsUp className="size-3" aria-hidden />
            {compact.format(q.votes)}
          </span>
          <AnswerBadge answers={q.answers} solved={q.solved} />
          <span className="flex items-center gap-1">
            <Eye className="size-3" aria-hidden />
            {compact.format(q.views)}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1">
          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {q.tags.map((t) => (
              <li key={t}>
                <Link
                  href={`/questions?tag=${t}`}
                  className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
                >
                  {t}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              aria-hidden
              className="flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground"
            >
              {initialsOf(q.authorName)}
            </span>
            <span className="font-medium text-foreground/80">{q.authorName}</span>
            <TimeAgo date={q.$createdAt} />
          </div>
        </div>
      </div>
    </article>
  );
}
