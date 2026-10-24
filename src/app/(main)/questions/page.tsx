import type { Metadata } from "next";
import { QuestionsPage } from "@/components/questions/questions-page";
import type { SearchParams } from "@/components/questions/question-feed";

export const metadata: Metadata = { title: "Questions" };

export default function AllQuestionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <QuestionsPage
      title="All questions"
      description="Browse, search and filter every question on Riverflow."
      basePath="/questions"
      searchParams={searchParams}
    />
  );
}
