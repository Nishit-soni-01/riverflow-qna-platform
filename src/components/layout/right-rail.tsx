import Link from "next/link";
import { POPULAR_TAGS } from "@/lib/questions";

export function RightRail() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">Popular tags</h2>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {POPULAR_TAGS.map((t) => (
            <li key={t.name}>
              <Link
                href={`/questions?tag=${t.name}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-accent"
              >
                {t.name}
                <span className="text-muted-foreground">{t.count}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/tags"
          className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
        >
          Browse all tags
        </Link>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">Ask a question people can answer</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
          <li>Search first, your question may already exist.</li>
          <li>Write a title that states the problem in one sentence.</li>
          <li>Show the code you tried and the error you got.</li>
          <li>Add up to five tags so the right people find it.</li>
        </ol>
      </section>
    </div>
  );
}
