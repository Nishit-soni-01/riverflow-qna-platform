
"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  HelpCircle,
  Lightbulb,
  Plus,
  Send,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createQuestion } from "@/models/client/questions";

export default function AskQuestionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/^#/, "");

    if (!tag) return;

    if (!/^[a-z0-9+-]+$/.test(tag)) {
      setError("Tags can contain letters, numbers, + and - only.");
      return;
    }

    if (tags.includes(tag)) {
      setTagInput("");
      return;
    }

    if (tags.length >= 5) {
      setError("You can add up to 5 tags.");
      return;
    }

    setTags((current) => [...current, tag]);
    setTagInput("");
    setError("");
  };

  const handleTagKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((current) =>
      current.filter((tag) => tag !== tagToRemove),
    );
    setError("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");

    if (isSubmitting) return;

    if (title.trim().length < 15) {
      setError("Your title should be at least 15 characters long.");
      return;
    }

    if (title.trim().length > 100) {
      setError("Your title cannot exceed 100 characters.");
      return;
    }

    if (content.trim().length < 30) {
      setError(
        "Please provide at least 30 characters describing your problem.",
      );
      return;
    }

    if (tags.length === 0) {
      setError("Please add at least one tag.");
      return;
    }

    setIsSubmitting(true);

    try {
      const question = await createQuestion({
        title: title.trim(),
        content: content.trim(),
        tags,
      });

      router.push(`/questions/${question.$id}`);
    } catch (err) {
      console.error("Question submission failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your question. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page heading */}
      <div className="space-y-4">
        <Link
          href="/questions"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to questions
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <HelpCircle className="size-3.5" />
              Community knowledge starts here
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ask a question
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Share what you are working on. Include enough detail
              so other developers can understand and help solve your
              problem.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setPreview((current) => !current)}
            className="w-fit gap-2"
          >
            {preview ? (
              <>
                <EyeOff className="size-4" />
                Edit question
              </>
            ) : (
              <>
                <Eye className="size-4" />
                Preview
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Writing guidance */}
      <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />

        <div className="space-y-1">
          <h2 className="text-sm font-semibold">
            Writing a great question
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Describe the problem clearly, show what you have tried,
            include relevant code or error messages, and add tags
            that identify the technologies involved.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Main editor */}
          <div className="min-w-0 space-y-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
            {preview ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Question preview
                  </p>

                  <h2 className="break-words text-2xl font-bold tracking-tight">
                    {title.trim() || "Your question title"}
                  </h2>
                </div>

                <div className="min-h-48 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
                  {content.trim() ||
                    "Your question description will appear here."}
                </div>

                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Title */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor="question-title"
                      className="text-base font-semibold"
                    >
                      Title
                    </Label>

                    <span className="text-xs text-muted-foreground">
                      {title.length}/100
                    </span>
                  </div>

                  <Input
                    id="question-title"
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value.slice(0, 100));
                      setError("");
                    }}
                    placeholder="e.g. How do I handle authentication errors in Next.js?"
                    maxLength={100}
                    required
                    className="h-12"
                  />

                  <p className="text-xs leading-5 text-muted-foreground">
                    Be specific and imagine you are asking another
                    developer for help.
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor="question-content"
                      className="text-base font-semibold"
                    >
                      Description
                    </Label>

                    <span className="text-xs text-muted-foreground">
                      {content.length} characters
                    </span>
                  </div>

                  <textarea
                    id="question-content"
                    value={content}
                    onChange={(event) => {
                      setContent(event.target.value);
                      setError("");
                    }}
                    placeholder={`Explain your problem in detail...\n\n1. What are you trying to achieve?\n2. What have you tried so far?\n3. What result did you expect?\n4. What happened instead?`}
                    required
                    rows={12}
                    className="flex min-h-64 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm leading-6 shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  />

                  <p className="text-xs leading-5 text-muted-foreground">
                    Include code snippets, error messages, and the
                    steps needed to reproduce the problem.
                  </p>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      htmlFor="question-tags"
                      className="text-base font-semibold"
                    >
                      Tags
                    </Label>

                    <span className="text-xs text-muted-foreground">
                      {tags.length}/5
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      id="question-tags"
                      value={tagInput}
                      onChange={(event) => {
                        setTagInput(event.target.value);
                        setError("");
                      }}
                      onKeyDown={handleTagKeyDown}
                      placeholder="e.g. nextjs"
                      disabled={tags.length >= 5}
                      aria-describedby="tag-help"
                      className="h-11"
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addTag}
                      disabled={!tagInput.trim() || tags.length >= 5}
                      className="shrink-0 gap-2"
                    >
                      <Plus className="size-4" />
                      Add
                    </Button>
                  </div>

                  <p
                    id="tag-help"
                    className="text-xs text-muted-foreground"
                  >
                    Press Enter or click Add. Use up to 5 tags.
                  </p>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary"
                        >
                          {tag}

                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            aria-label={`Remove ${tag} tag`}
                            className="rounded-sm outline-none hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <X className="size-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">
                Be respectful. Never include passwords or private
                credentials.
              </p>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                <Send className="size-4" />
                {isSubmitting ? "Publishing..." : "Publish question"}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="font-semibold">Before you post</h2>

              <ul className="mt-4 space-y-4 text-sm">
                {[
                  ["Clear title", "Summarize the specific problem."],
                  ["Useful details", "Include what you tried and what failed."],
                  ["Relevant tags", "Help the right developers find your question."],
                  ["Minimal example", "Include only code relevant to the issue."],
                ].map(([heading, description]) => (
                  <li key={heading} className="flex gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="size-1.5 rounded-full bg-primary" />
                    </span>

                    <div className="space-y-1">
                      <p className="font-medium">{heading}</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-5">
              <h2 className="text-sm font-semibold">
                Your question checklist
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <ChecklistItem
                  label="Title added"
                  complete={title.trim().length >= 15}
                />

                <ChecklistItem
                  label="Description added"
                  complete={content.trim().length >= 30}
                />

                <ChecklistItem
                  label="At least one tag"
                  complete={tags.length > 0}
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Complete these basics before submitting your question.
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

function ChecklistItem({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex size-4 items-center justify-center rounded-full border ${
          complete
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40"
        }`}
      >
        {complete && <span className="text-[10px]">✓</span>}
      </span>

      <span
        className={
          complete ? "text-foreground" : "text-muted-foreground"
        }
      >
        {label}
      </span>
    </div>
  );
}
