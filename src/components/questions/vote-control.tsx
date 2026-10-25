
"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  castVote,
  getVoteSummary,
  type VoteStatus,
  type VoteType,
} from "@/models/client/votes";


interface VoteControlProps {
  type: VoteType;
  typeId: string;
  authorId: string;
  refreshKey?: number;
}

export function VoteControl({
  type,
  typeId,
  authorId,
  refreshKey = 0,
}: VoteControlProps) {
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [myVote, setMyVote] = useState<VoteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const summary = await getVoteSummary(type, typeId);
      setUpvotes(summary.upvotes);
      setDownvotes(summary.downvotes);
      setMyVote(summary.myVote);
    } catch (err) {
      console.error("Failed to load votes:", err);
      setError("Couldn't load votes.");
    } finally {
      setLoading(false);
    }
  }, [type, typeId]);

  useEffect(() => {
    let cancelled = false;

    async function loadVotes() {
      await Promise.resolve();

      if (!cancelled) {
        void refresh();
      }
    }

    void loadVotes();

    return () => {
      cancelled = true;
    };
  }, [refresh, refreshKey]);


  const handleVote = async (vote: VoteStatus) => {
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      await castVote(type, typeId, vote);
      await refresh();

      window.dispatchEvent(
        new CustomEvent("riverflow:reputation-updated", {
          detail: { userId: authorId },
        })
      );
    } catch (err) {
      console.error("Failed to cast vote:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't save your vote. Please log in and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Upvote"
        aria-pressed={myVote === "upvoted"}
        disabled={loading || submitting}
        onClick={() => void handleVote("upvoted")}
        className={myVote === "upvoted" ? "border-primary text-primary" : ""}
      >
        {submitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowUp className="size-4" />
        )}
      </Button>

      <span className="text-sm font-semibold tabular-nums" aria-live="polite">
        {loading ? "…" : upvotes - downvotes}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Downvote"
        aria-pressed={myVote === "downvoted"}
        disabled={loading || submitting}
        onClick={() => void handleVote("downvoted")}
        className={
          myVote === "downvoted" ? "border-primary text-primary" : ""
        }
      >
        <ArrowDown className="size-4" />
      </Button>

      {error && (
        <p role="alert" className="max-w-40 text-center text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
