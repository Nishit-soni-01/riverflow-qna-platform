"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/Auth";

import {
  Award,
  ArrowLeft,
  Loader2,
  UserRound,
  MessageSquare,
  MessagesSquare,
  Eye,
  CheckCircle2,
  Pencil,
  ImagePlus,
  Save,
  X,
} from "lucide-react";

interface ProfileQuestion {
  id: string;
  title: string;
  tags: string[];
  views: number;
  createdAt: string;
}

interface ProfileAnswer {
  id: string;
  questionId: string;
  questionTitle: string;
  content: string;
  createdAt: string;
  accepted: boolean;
}

interface PublicProfile {
  id: string;
  name: string;
  about: string;
  avatarUrl: string;
  reputation: number;
  badge: "Beginner" | "Contributor" | "Expert";
  totalQuestions: number;
  totalAnswers: number;
  acceptedAnswers: number;
  recentQuestions: ProfileQuestion[];
  recentAnswers: ProfileAnswer[];
}

const badgeStyles: Record<PublicProfile["badge"], string> = {
  Beginner: "bg-muted text-muted-foreground",
  Contributor: "bg-sky-500/10 text-sky-600",
  Expert: "bg-amber-500/10 text-amber-600",
};

function UserProfileContent() {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user, jwt } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/users/${encodeURIComponent(userId)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("This user profile could not be found.");
          }

          throw new Error("Unable to load this profile. Please try again.");
        }

        const data = (await response.json()) as PublicProfile;

        if (!cancelled) {
          setProfile(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading the profile."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (userId) {
      void loadProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleSaveProfile() {
    if (!jwt || !user || user.$id !== profile?.id) {
      setSaveMessage("Please sign in to edit your own profile.");
      return;
    }

    setSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          name: editName,
          about: editAbout,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update profile.");
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              name: data.name,
              about: data.about,
            }
          : current
      );

      setEditing(false);
      setSaveMessage("Profile updated successfully.");
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload() {
    if (!jwt || !user || user.$id !== profile?.id) {
      setSaveMessage("Please sign in to edit your own profile.");
      return;
    }

    if (!selectedAvatar) {
      setSaveMessage("Please choose an image first.");
      return;
    }

    setUploadingAvatar(true);
    setSaveMessage("");

    try {
      const formData = new FormData();
      formData.append("avatar", selectedAvatar);

      const response = await fetch("/api/users/me/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to upload avatar.");
      }

      setProfile((current) =>
        current
          ? { ...current, avatarUrl: data.avatarUrl }
          : current
      );

      setSelectedAvatar(null);
      setAvatarPreview("");
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }

      setSaveMessage("Profile picture updated successfully.");
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : "Unable to upload avatar."
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAvatarRemove() {
    if (!jwt || !user || user.$id !== profile?.id) {
      setSaveMessage("Please sign in to edit your own profile.");
      return;
    }

    if (!profile?.avatarUrl) {
      setSaveMessage("There is no profile picture to remove.");
      return;
    }

    setUploadingAvatar(true);
    setSaveMessage("");

    try {
      const response = await fetch("/api/users/me/avatar", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to remove profile picture.");
      }

      const endpoint = window.location.origin;
      const fallbackUrl = new URL("/api/users/" + encodeURIComponent(profile.id), endpoint);

      // Reload the profile to retrieve the generated initials avatar.
      const profileResponse = await fetch(fallbackUrl.toString(), {
        cache: "no-store",
      });

      if (!profileResponse.ok) {
        throw new Error("Picture removed, but profile refresh failed. Reload the page.");
      }

      const refreshedProfile = await profileResponse.json();
      setProfile(refreshedProfile);
      setSelectedAvatar(null);
      setAvatarPreview("");

      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }

      setSaveMessage("Profile picture removed successfully.");
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : "Unable to remove profile picture."
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-64 max-w-4xl items-center justify-center px-4">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading profile...
        </span>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Riverflow
        </Link>

        <div className="rounded-xl border p-6">
          <h1 className="text-lg font-semibold">Profile unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || "This user profile could not be found."}
          </p>
        </div>
      </main>
    );
  }

  const initials = profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Riverflow
      </Link>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`${profile.name}'s avatar`}
                className="size-24 rounded-2xl border-4 border-card bg-card object-cover shadow-sm"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-card bg-primary/10 text-2xl font-semibold text-primary">
                {initials || <UserRound className="size-8" />}
              </div>
            )}
            {/* Profile name */}
            <div className="min-w-0 flex-1 pt-2">
              <h1 className="break-words text-2xl font-bold tracking-tight">
                {profile.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Riverflow community member
              </p>
            </div>
            {/* Add the Edit Profile button here */}
            {user?.$id === profile.id && !editing && (
              <button
                type="button"
                onClick={() => {
                  setEditName(profile.name);
                  setEditAbout(profile.about);
                  setSaveMessage("");
                  setEditing(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <Pencil className="size-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Reputation</p>
            <p className="mt-1 text-2xl font-bold">
              {profile.reputation.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Community badge</p>
            <span
              className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${badgeStyles[profile.badge]}`}
            >
              <Award className="size-4" />
              {profile.badge}
            </span>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Questions asked</p>
            <p className="mt-1 text-2xl font-bold">
              {profile.totalQuestions.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Answers posted</p>
            <p className="mt-1 text-2xl font-bold">
              {profile.totalAnswers.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border p-4 sm:col-span-2">
            <p className="text-sm text-muted-foreground">Accepted answers</p>
            <p className="mt-1 text-2xl font-bold">
              {profile.acceptedAnswers.toLocaleString()}
            </p>
          </div>
        </div>

        {/* User Activity */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold">Activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recent contributions to the Riverflow community.
          </p>

          {/* Recent Questions */}
          <section className="mt-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <MessageSquare className="size-5" />
              Recent Questions
              <span className="text-sm font-normal text-muted-foreground">
                ({profile.recentQuestions.length})
              </span>
            </h3>

            {profile.recentQuestions.length === 0 ? (
              <p className="mt-3 rounded-lg border p-4 text-sm text-muted-foreground">
                No questions to display yet.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {profile.recentQuestions.map((question) => (
                  <Link
                    key={question.id}
                    href={`/questions/${encodeURIComponent(question.id)}`}
                    className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <p className="font-medium">{question.title}</p>

                    {question.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {question.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="size-3.5" />
                      {question.views} views
                      <span className="mx-1">·</span>
                      {new Date(question.createdAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Answers */}
          <section className="mt-8">
            <h3 className="flex items-center gap-2 font-semibold">
              <MessagesSquare className="size-5" />
              Recent Answers
              <span className="text-sm font-normal text-muted-foreground">
                ({profile.recentAnswers.length})
              </span>
            </h3>

            {profile.recentAnswers.length === 0 ? (
              <p className="mt-3 rounded-lg border p-4 text-sm text-muted-foreground">
                No answers to display yet.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {profile.recentAnswers.map((answer) => (
                  <Link
                    key={answer.id}
                    href={`/questions/${encodeURIComponent(answer.questionId)}`}
                    className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Answered on
                    </p>

                    <h4 className="mb-3 font-semibold leading-snug text-primary">
                      {answer.questionTitle}
                    </h4>

                    <p className="whitespace-pre-wrap break-words text-sm">
                      {answer.content.length > 240
                        ? `${answer.content.slice(0, 240)}…`
                        : answer.content}
                    </p>

                    {answer.accepted && (
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="size-4" />
                        Accepted answer
                      </span>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>View original question →</span>
                      <span>
                        {new Date(answer.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 border-t pt-5">
          <h2 className="font-semibold">About</h2>

          {editing ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Profile picture
                </label>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full text-sm"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    setSelectedAvatar(file ?? null);
                    setAvatarPreview(
                      file ? URL.createObjectURL(file) : ""
                    );
                    setSaveMessage("");
                  }}
                />

                {avatarPreview && (
                  <img
                    src={avatarPreview}
                    alt="Selected profile picture preview"
                    className="mt-3 size-24 rounded-2xl border object-cover"
                  />
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleAvatarUpload}
                    disabled={!selectedAvatar || uploadingAvatar}
                    className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    <ImagePlus className="size-4" />
                    {uploadingAvatar ? "Uploading..." : "Upload picture"}
                  </button>

                  {profile.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleAvatarRemove}
                      disabled={uploadingAvatar}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <X className="size-4" />
                      {uploadingAvatar ? "Please wait..." : "Remove picture"}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Display name
                </label>
                <input
                  id="edit-name"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  maxLength={50}
                  minLength={2}
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-about"
                  className="mb-2 block text-sm font-medium"
                >
                  About you
                </label>
                <textarea
                  id="edit-about"
                  value={editAbout}
                  onChange={(event) => setEditAbout(event.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Tell the community a little about yourself..."
                  className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {editAbout.length}/500 characters
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving || editName.trim().length < 2}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="size-4" />
                  {saving ? "Saving..." : "Save changes"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setSaveMessage("");
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  <X className="size-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {profile.about ||
                `${profile.name} is part of the Riverflow developer community.`}
            </p>
          )}

          {saveMessage && (
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              {saveMessage}
            </p>
          )}
        </div>

        <div className="mt-5 rounded-xl bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">User ID</p>
          <p className="mt-1 break-all font-mono text-xs">{profile.id}</p>
        </div>
      </section>
    </main>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading profile...</div>}>
      <UserProfileContent />
    </Suspense>
  );
}