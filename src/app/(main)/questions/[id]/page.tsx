"use client";

import {
  Suspense,
  useEffect,
  useState,
  useCallback,
  type SyntheticEvent,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import { Query, ID, Permission, Role } from "appwrite";

import { AuthorProfile } from "@/components/users/author-profile";
import { VoteControl } from "@/components/questions/vote-control";
import { CommentsSection } from "@/components/questions/comments-section";
import { Button } from "@/components/ui/button";
import { tablesDB, account } from "@/models/client/config";
import { db, questionTable, answerTable } from "@/models/name";
import { createNotification } from "@/models/client/notifications";

interface Question {
  $id: string;
  $createdAt: string;
  title: string;
  content: string;
  authorId: string;
  tags: string[];
  acceptedAnswerId?: string | null;
}

interface Answer {
  $id: string;
  $createdAt: string;
  content: string;
  questionId: string;
  authorId: string;
  isAccepted?: boolean;
}

function QuestionDetailsContent() {
  const params = useParams<{ id: string }>();
  const questionId = params.id;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswersLoading, setIsAnswersLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerContent, setAnswerContent] = useState("");
  const [error, setError] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [answerSuccess, setAnswerSuccess] = useState("");
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const user = await account.get();
        if (!cancelled) {
          setCurrentUserId(user.$id);
        }
      } catch {
        if (!cancelled) {
          setCurrentUserId(null);
        }
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchQuestion() {
      setIsLoading(true);
      setError("");

      try {
        const row = await tablesDB.getRow({
          databaseId: db,
          tableId: questionTable,
          rowId: questionId,
        });

        if (!cancelled) {
          setQuestion(row as unknown as Question);
        }
      } catch (err) {
        console.error("Failed to load question:", err);

        if (!cancelled) {
          setError(
            "We couldn't find this question. It may have been removed, or you may not have permission to view it."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (questionId) {
      fetchQuestion();
    }

    return () => {
      cancelled = true;
    };
  }, [questionId]);

  const fetchAnswers = useCallback(async () => {
    setIsAnswersLoading(true);
    setAnswerError("");

    try {
      const response = await tablesDB.listRows({
        databaseId: db,
        tableId: answerTable,
        queries: [
          Query.equal("questionId", [questionId]),
          Query.orderAsc("$createdAt"),
          Query.limit(100),
        ],
      });

      setAnswers(response.rows as unknown as Answer[]);
    } catch (err) {
      console.error("Failed to load answers:", err);
      setAnswerError(
        "Couldn't load answers. Please try refreshing the list."
      );
    } finally {
      setIsAnswersLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    if (questionId) {
      fetchAnswers();
    }
  }, [questionId, fetchAnswers]);

  const handleAcceptAnswer = async (answerId: string) => {
    if (!question || currentUserId !== question.authorId) {
      setAnswerError("Only the question author can accept an answer.");
      return;
    }

    setAnswerError("");
    setAnswerSuccess("");
    setIsAccepting(answerId);

    try {
      const user = await account.get();

      if (user.$id !== question.authorId) {
        throw new Error("You are not authorized to accept this answer.");
      }

      const nextAcceptedAnswerId =
        question.acceptedAnswerId === answerId ? null : answerId;

      await tablesDB.updateRow({
        databaseId: db,
        tableId: questionTable,
        rowId: question.$id,
        data: { acceptedAnswerId: nextAcceptedAnswerId },
      });

      setQuestion((previous) =>
        previous
          ? { ...previous, acceptedAnswerId: nextAcceptedAnswerId }
          : previous
      );

      setAnswerSuccess(
        nextAcceptedAnswerId
          ? "Answer accepted successfully."
          : "Accepted answer removed."
      );
    } catch (err) {
      console.error("Failed to accept answer:", err);
      setAnswerError(
        err instanceof Error
          ? err.message
          : "Couldn't update the accepted answer. Please try again."
      );
    } finally {
      setIsAccepting(null);
    }
  };

  const handleSubmitAnswer = async (
    event: SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setAnswerError("");
    setAnswerSuccess("");

    const content = answerContent.trim();

    if (content.length < 10) {
      setAnswerError("Your answer must contain at least 10 characters.");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const user = await account.get();

      const createdAnswer = await tablesDB.createRow({
        databaseId: db,
        tableId: answerTable,
        rowId: ID.unique(),
        data: {
          content,
          questionId,
          authorId: user.$id,
        },
        permissions: [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ],
      });

      setAnswerContent("");
      setAnswerSuccess("Your answer was posted successfully.");

      await fetchAnswers();
      try {
        await createNotification("answer", createdAnswer.$id);
      } catch(notificationError){
        console.error(
           "Answer was posted, but notification creation failed:",
           notificationError
       );
      }
    } catch (err) {
      console.error("Failed to submit answer:", err);

      setAnswerError(
        err instanceof Error
          ? err.message
          : "Couldn't post your answer. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-5 w-36 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="text-2xl font-semibold">Question not found</h1>

        <p className="mt-3 text-muted-foreground">{error}</p>

        <Link
          href="/questions"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to questions
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/questions"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All questions
      </Link>

      <header className="space-y-5 border-b pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Question
          </span>

          <span className="text-sm text-muted-foreground">
            ID: {question.$id}
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {question.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <AuthorProfile userId={question.authorId} />

          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-4" />
            {new Date(question.$createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-[56px_minmax(0,1fr)]">
        <aside className="flex items-start gap-3 md:flex-col">
          <VoteControl type="question" typeId={question.$id} />

          <span className="flex items-center gap-2 text-sm text-muted-foreground md:flex-col">
            <MessageSquare className="size-4" />
            <span>{answers.length}</span>
          </span>
        </aside>

        <article className="min-w-0 space-y-8">
          <div className="rounded-xl border bg-card p-5 sm:p-7">
            <h2 className="mb-4 text-lg font-semibold">Question details</h2>

            <div className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-foreground/90 sm:text-base">
              {question.content}
            </div>
          </div>

          <CommentsSection type="question" typeId={question.$id} />

          {question.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/questions?tag=${encodeURIComponent(tag)}`}
                  className="rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <section className="space-y-5">
            <div className="flex items-center justify-between gap-3 border-b pb-4">
              <h2 className="text-2xl font-semibold">
                {answers.length}{" "}
                {answers.length === 1 ? "Answer" : "Answers"}
              </h2>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchAnswers}
                disabled={isAnswersLoading}
              >
                Refresh
              </Button>
            </div>

            {isAnswersLoading ? (
              <div className="space-y-3">
                <div className="h-28 animate-pulse rounded-xl bg-muted" />
                <div className="h-28 animate-pulse rounded-xl bg-muted" />
              </div>
            ) : answerError && answers.length === 0 ? (
              <div className="rounded-xl border border-destructive/30 p-5 text-sm text-destructive">
                {answerError}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-3"
                  onClick={fetchAnswers}
                >
                  Try again
                </Button>
              </div>
            ) : answers.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <MessageSquare className="mx-auto size-8 text-muted-foreground" />
                <h3 className="mt-3 font-semibold">No answers yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Be the first to share a helpful solution.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {answers.map((answer) => (
                  <div key={answer.$id} className="space-y-3">
                    <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 rounded-xl border bg-card p-5 sm:p-6">
                      <VoteControl type="answer" typeId={answer.$id} />

                      <div className="min-w-0">
                        <div className="space-y-3">
                          {question.acceptedAnswerId === answer.$id && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                              <CheckCircle2 className="size-5" />
                              Accepted answer
                            </div>
                          )}

                          <div className="whitespace-pre-wrap break-words text-sm leading-7 sm:text-base">
                            {answer.content}
                          </div>

                          {currentUserId === question.authorId && (
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                question.acceptedAnswerId === answer.$id
                                  ? "outline"
                                  : "default"
                              }
                              disabled={isAccepting !== null}
                              onClick={() => handleAcceptAnswer(answer.$id)}
                            >
                              {isAccepting === answer.$id ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 size-4" />
                              )}
                              {question.acceptedAnswerId === answer.$id
                                ? "Unaccept answer"
                                : "Accept answer"}
                            </Button>
                          )}
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
                          <AuthorProfile userId={answer.authorId} compact />

                          <span>·</span>

                          <CalendarDays className="size-3.5" />

                          <span>
                            {new Date(answer.$createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <CommentsSection
                      type="answer"
                      typeId={answer.$id}
                    />
                  </div>
                ))}
              </div>
            )}

            {answerError && answers.length > 0 && (
              <p role="alert" className="text-sm text-destructive">
                {answerError}
              </p>
            )}
          </section>

          <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-7">
            <div>
              <h2 className="text-xl font-semibold">Your answer</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Explain your solution clearly. Include relevant details and
                code where helpful.
              </p>
            </div>

            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <label htmlFor="answer-content" className="sr-only">
                Write your answer
              </label>

              <textarea
                id="answer-content"
                value={answerContent}
                onChange={(event) => {
                  setAnswerContent(event.target.value);
                  setAnswerError("");
                  setAnswerSuccess("");
                }}
                placeholder="Write your answer here..."
                rows={7}
                maxLength={20000}
                disabled={isSubmitting}
                className="w-full resize-y rounded-lg border bg-background px-4 py-3 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {answerContent.length}/20000 characters
                </span>

                <Button
                  type="submit"
                  disabled={
                    isSubmitting || answerContent.trim().length < 10
                  }
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 size-4" />
                  )}

                  {isSubmitting ? "Posting..." : "Post your answer"}
                </Button>
              </div>
            </form>

            {answerError && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {answerError}
              </p>
            )}

            {answerSuccess && (
              <p
                role="status"
                className="flex items-center gap-2 text-sm text-emerald-600"
              >
                <CheckCircle2 className="size-4" />
                {answerSuccess}
              </p>
            )}
          </section>
        </article>
      </div>
    </div>
  );
}

export default function QuestionDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <QuestionDetailsContent />
    </Suspense>
  );
}