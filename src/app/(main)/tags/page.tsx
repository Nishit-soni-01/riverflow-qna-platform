
import type { Metadata } from "next";
import Link from "next/link";
import { getQuestions } from "@/lib/questions";

export const instant = false;

export const metadata: Metadata = {
  title: "Tags",
  description: "Explore topics discussed on Riverflow.",
};

export default async function TagsPage() {
  // Retrieve questions and collect their tags.
  const { items } = await getQuestions({
    sort: "newest",
    page: 1,
    pageSize: 100,
  });

  const tagCounts = new Map<string, number>();

  for (const question of items) {
    for (const tag of question.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const tags = Array.from(tagCounts.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tags</h1>
        <p className="mt-2 text-muted-foreground">
          Explore topics and discover questions related to your interests.
        </p>
      </div>

      {tags.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <h2 className="text-lg font-semibold">No tags found yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tags will appear here when questions with tags are available.
          </p>
          <Link
            href="/ask-question"
            className="mt-4 inline-block text-primary underline"
          >
            Ask a question
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/questions?tag=${encodeURIComponent(tag)}`}
              className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted"
            >
              <span className="inline-block rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                {tag}
              </span>

              <p className="mt-3 text-sm text-muted-foreground">
                {count} {count === 1 ? "question" : "questions"} on this page's data
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
