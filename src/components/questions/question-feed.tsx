import Link from "next/link";
import { PenLine, SearchX } from "lucide-react";
import { getQuestions, type Sort } from "@/lib/questions";
import { QuestionCard } from "./question-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SearchParams = Promise<{ sort?: string; q?: string; tag?: string }>;

const TABS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "active", label: "Active" },
  { value: "top", label: "Top voted" },
];

export async function QuestionFeed({
  searchParams,
  basePath,
}: {
  searchParams: SearchParams;
  basePath: string;
}) {
  const sp = await searchParams;
  const sort: Sort = TABS.some((t) => t.value === sp.sort)
    ? (sp.sort as Sort)
    : "newest";

  const { items, total } = await getQuestions({ sort, q: sp.q, tag: sp.tag });

  const hrefFor = (s: Sort) => {
    const p = new URLSearchParams();
    if (sp.q) p.set("q", sp.q);
    if (sp.tag) p.set("tag", sp.tag);
    if (s !== "newest") p.set("sort", s);
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "question" : "questions"}
          {sp.q && <> matching “{sp.q}”</>}
          {sp.tag && <> tagged “{sp.tag}”</>}
          {(sp.q || sp.tag) && (
            <Link
              href={basePath}
              className="ml-2 font-medium text-primary hover:underline"
            >
              Clear filters
            </Link>
          )}
        </p>

        <nav
          aria-label="Sort questions"
          className="inline-flex rounded-lg bg-muted p-1"
        >
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={hrefFor(t.value)}
              aria-current={sort === t.value ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                sort === t.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No questions found"
          description="Try different keywords or remove a filter. If nobody has asked it yet, you can be the first."
          action={
            <Button render={<Link href="/ask-question" />} nativeButton={false}>
              <PenLine className="size-4" />
              Ask a question
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((q) => (
            <QuestionCard key={q.$id} q={q} />
          ))}
        </div>
      )}
    </div>
  );
}
