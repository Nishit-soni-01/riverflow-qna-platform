import { QuestionsPage } from "@/components/questions/questions-page";
import type { SearchParams } from "@/components/questions/question-feed";

export default function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <QuestionsPage
      title="Top questions"
      description="Ask, answer and learn alongside other developers."
      basePath="/"
      searchParams={searchParams}
    />
  );
}
