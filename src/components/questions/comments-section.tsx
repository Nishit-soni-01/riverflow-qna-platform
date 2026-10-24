
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CalendarDays, Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { ID, Permission, Query, Role } from "appwrite";
import { tablesDB, account } from "@/models/client/config";
import { db, commentTable } from "@/models/name";
import { AuthorProfile } from "@/components/users/author-profile";
import { Button } from "@/components/ui/button";
import { createNotification } from "@/models/client/notifications";

type CommentType = "question" | "answer";

interface Comment {
  $id: string;
  $createdAt: string;
  content: string;
  type: CommentType;
  typeId: string;
  authorId: string;
}

interface CommentsSectionProps {
  type: CommentType;
  typeId: string;
}

export function CommentsSection({
  type,
  typeId,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await tablesDB.listRows({
        databaseId: db,
        tableId: commentTable,
        queries: [
          Query.equal("type", [type]),
          Query.equal("typeId", [typeId]),
          Query.orderAsc("$createdAt"),
          Query.limit(100),
        ],
      });

      setComments(response.rows as unknown as Comment[]);
    } catch (err) {
      console.error("Failed to load comments:", err);
      setError("Couldn't load comments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [type, typeId]);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const user = await account.get();
        if (!cancelled) setCurrentUserId(user.$id);
      } catch {
        if (!cancelled) setCurrentUserId(null);
      }
    }

    void loadUser();
    void fetchComments();

    return () => {
      cancelled = true;
    };
  }, [fetchComments]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const text = content.trim();

    if (!text) {
      setError("Please write a comment first.");
      return;
    }

    if (text.length > 1000) {
      setError("Comments must be 1,000 characters or fewer.");
      return;
    }

    setSubmitting(true);

    try {
      const user = await account.get();

      const createdComment = await tablesDB.createRow({
        databaseId: db,
        tableId: commentTable,
        rowId: ID.unique(),
        data: {
          content: text,
          type,
          typeId,
          authorId: user.$id,
        },
        permissions: [
          Permission.read(Role.any()),
          Permission.delete(Role.user(user.$id)),
        ],
      });

      try{
        await createNotification(
          type === "question" ? "question_comment" : "answer_comment",
          createdComment.$id
        );
      } catch (notificationError) {
        console.error(
           "Comment was posted, but notification creation failed:",
           notificationError
           );
      }

      setContent("");
      setCurrentUserId(user.$id);
      setSuccess("Comment posted.");
      await fetchComments();
    } catch (err) {
      console.error("Failed to post comment:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't post your comment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!currentUserId) return;

    setError("");
    setSuccess("");
    setDeletingId(commentId);

    try {
      const comment = comments.find((item) => item.$id === commentId);

      if (!comment || comment.authorId !== currentUserId) {
        setError("You can delete only your own comments.");
        return;
      }

      await tablesDB.deleteRow({
        databaseId: db,
        tableId: commentTable,
        rowId: commentId,
      });

      setComments((previous) =>
        previous.filter((item) => item.$id !== commentId)
      );
      setSuccess("Comment deleted.");
    } catch (err) {
      console.error("Failed to delete comment:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't delete the comment."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-4 border-t pt-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="size-4" />
        Comments ({comments.length})
      </h3>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.$id}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="whitespace-pre-wrap wrap-break-word">
                  {comment.content}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <AuthorProfile userId={comment.authorId} compact />
                  <span>·</span>
                  <CalendarDays className="size-3" />
                  <span>
                    {new Date(comment.$createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {currentUserId === comment.authorId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Delete comment"
                  disabled={deletingId === comment.$id}
                  onClick={() => void handleDelete(comment.$id)}
                >
                  {deletingId === comment.$id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              setError("");
              setSuccess("");
            }}
            placeholder="Add a comment..."
            rows={2}
            maxLength={1000}
            disabled={submitting}
            className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {content.length}/1000
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !content.trim()}
            >
              {submitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              Post comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Log in to add a comment.
        </p>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="text-sm text-emerald-600">{success}</p>}
    </section>
  );
}
