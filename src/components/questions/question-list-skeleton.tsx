export function QuestionListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading questions">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-5 rounded-xl border bg-card p-5">
            <div className="hidden w-24 shrink-0 flex-col items-end gap-2 sm:flex">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-14 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-5 w-14 animate-pulse rounded bg-muted" />
                <div className="h-5 w-16 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
