
"use client";

import { useEffect, useState } from "react";
import { UserRound, Award } from "lucide-react";

interface PublicProfile {
  id: string;
  name: string;
  avatarUrl: string;
  reputation: number;
  badge: "Beginner" | "Contributor" | "Expert";
}

interface AuthorProfileProps {
  userId: string;
  compact?: boolean;
}

const badgeStyles: Record<PublicProfile["badge"], string> = {
  Beginner: "bg-muted text-muted-foreground",
  Contributor: "bg-sky-500/10 text-sky-600",
  Expert: "bg-amber-500/10 text-amber-600",
};

export function AuthorProfile({
  userId,
  compact = false,
}: AuthorProfileProps) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setProfile(null);
      setAvatarFailed(false);

      try {
        const response = await fetch(
          `/api/users/${encodeURIComponent(userId)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`Profile request failed: ${response.status}`);
        }

        const data = (await response.json()) as PublicProfile;

        if (!cancelled) {
          setProfile(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Could not load author profile:", error);
        }
      }
    }

    if (userId) {
      loadProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const name = profile?.name || "Riverflow user";

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="inline-flex min-w-0 items-center gap-2">
      {profile?.avatarUrl && !avatarFailed ? (
        <img
          src={profile.avatarUrl}
          alt={`${name}'s avatar`}
          className="size-8 shrink-0 rounded-full border object-cover"
          onError={() => setAvatarFailed(true)}
        />
      ) : (
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          aria-hidden="true"
        >
          {profile ? initials : <UserRound className="size-4" />}
        </span>
      )}

      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {name}
        </span>

        {profile && (
          <span className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">
              {profile.reputation} reputation
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${badgeStyles[profile.badge]}`}
            >
              <Award className="size-3" />
              {profile.badge}
            </span>
          </span>
        )}

        {!compact && (
          <span className="block text-xs text-muted-foreground">
            Riverflow member
          </span>
        )}
      </span>
    </div>
  );
}
