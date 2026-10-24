import { Suspense } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RightRail } from "@/components/layout/right-rail";
import { QuestionFeed, type SearchParams } from "./question-feed";
import { QuestionListSkeleton } from "./question-list-skeleton";

export function QuestionsPage({
  title,
  description,
  basePath,
  searchParams,
}: {
  title: string;
  description: string;
  basePath: string;
  searchParams: SearchParams;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Button render={<Link href="/ask-question" />} nativeButton={false}>
            <PenLine className="size-4" />
            Ask question
          </Button>
        </div>

        {/* The page shell is static; only the feed waits for searchParams and data */}
        <Suspense fallback={<QuestionListSkeleton />}>
          <QuestionFeed searchParams={searchParams} basePath={basePath} />
        </Suspense>
      </section>

      <aside className="hidden lg:block">
        <RightRail />
      </aside>
    </div>
  );
}
