import Link from "next/link";
import { PenLine, Search, SearchX } from "lucide-react";
import { getQuestions, type Sort } from "@/lib/questions";
import { QuestionCard } from "./question-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SearchParams = Promise<{
  sort?: string;
  q?: string;
  tag?: string;
  page?: string;
}>;


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

  const pageSize = 20;
  const requestedPage = Number(sp.page ?? "1");
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const { items, total } = await getQuestions({
    sort,
    q: sp.q,
    tag: sp.tag,
    page,
    pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  
  const tagSuggestions = [
    ...new Set(items.flatMap((question) => question.tags)),
  ].sort((a, b) => a.localeCompare(b));
  const searchAction = basePath;
  const hrefFor = (s: Sort) => {
    const p = new URLSearchParams();
    if (sp.q) p.set("q", sp.q);
    if (sp.tag) p.set("tag", sp.tag);
    if (s !== "newest") p.set("sort", s);
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const hrefForPage = (nextPage: number) => {
    const params = new URLSearchParams();

    if (sp.q) params.set("q", sp.q);
    if (sp.tag) params.set("tag", sp.tag);
    if (sort !== "newest") params.set("sort", sort);
    if (nextPage > 1) params.set("page", String(nextPage));

    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  return (
    <div className="space-y-4">
      <form
        action={searchAction}
        method="GET"
        className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_200px_auto]"
      >
        <div className="relative">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search questions..."
            aria-label="Search questions"
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <input
            type="text"
            name="tag"
            defaultValue={sp.tag ?? ""}
            placeholder="Filter by tag"
            aria-label="Filter by tag"
            list="question-tag-suggestions"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <datalist id="question-tag-suggestions">
            {tagSuggestions.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>

          {tagSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tagSuggestions.slice(0, 8).map((tag) => (
                <Link
                  key={tag}
                  href={`${basePath}?${new URLSearchParams({
                    ...(sp.q ? { q: sp.q } : {}),
                    tag,
                    ...(sort !== "newest" ? { sort } : {}),
                  }).toString()}`}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-muted",
                    sp.tag?.toLowerCase() === tag.toLowerCase()
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        {sp.sort && sp.sort !== "newest" && (
          <input type="hidden" name="sort" value={sort} />
        )}

        <Button type="submit" className="h-10">
          <Search className="size-4" />
          Search
        </Button>
      </form>

      {/* Keep the existing results count, sort navigation, and question list below. */}
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
            {total > 0 && totalPages > 1 && (
        <nav
          aria-label="Question pagination"
          className="flex items-center justify-between gap-4 pt-4"
        >
          <Button
            render={<Link href={hrefForPage(page - 1)} />}
            nativeButton={false}
            variant="outline"
            disabled={page <= 1}
          >
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>

          <Button
            render={<Link href={hrefForPage(page + 1)} />}
            nativeButton={false}
            variant="outline"
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
