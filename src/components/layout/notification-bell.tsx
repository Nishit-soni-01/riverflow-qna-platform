
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2, MessageSquare } from "lucide-react";
import { Query } from "appwrite";

import { account, tablesDB } from "@/models/client/config";
import { db, notificationTable } from "@/models/name";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  $id: string;
  recipientId: string;
  actorId: string;
  type: "answer" | "question_comment" | "answer_comment";
  questionId: string;
  targetId: string;
  isRead: boolean;
  $createdAt: string;
}

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter();

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Confirm that the active Appwrite session belongs to this user.
      const user = await account.get();

      if (user.$id !== userId) {
        setNotifications([]);
        return;
      }

      const response = await tablesDB.listRows({
        databaseId: db,
        tableId: notificationTable,
        queries: [
          Query.equal("recipientId", [userId]),
          Query.orderDesc("$createdAt"),
          Query.limit(20),
        ],
      });

      setNotifications(response.rows as unknown as Notification[]);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Couldn't load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  async function openNotification(notification: Notification) {
    setUpdatingId(notification.$id);
    setError("");

    try {
      const user = await account.get();

      if (user.$id !== userId || notification.recipientId !== user.$id) {
        throw new Error("You cannot update this notification.");
      }

      if (!notification.isRead) {
        await tablesDB.updateRow({
          databaseId: db,
          tableId: notificationTable,
          rowId: notification.$id,
          data: { isRead: true },
        });

        setNotifications((previous) =>
          previous.map((item) =>
            item.$id === notification.$id
              ? { ...item, isRead: true }
              : item
          )
        );
      }

      router.push(`/questions/${notification.questionId}`);
    } catch (err) {
      console.error("Failed to open notification:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't open this notification."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function markAllAsRead() {
    setError("");

    try {
      const user = await account.get();

      if (user.$id !== userId) {
        throw new Error("Your session has changed. Please try again.");
      }

      const unread = notifications.filter((item) => !item.isRead);

      for (const notification of unread) {
        if (notification.recipientId !== user.$id) {
          continue;
        }

        await tablesDB.updateRow({
          databaseId: db,
          tableId: notificationTable,
          rowId: notification.$id,
          data: { isRead: true },
        });
      }

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, isRead: true }))
      );
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
      setError("Couldn't mark all notifications as read.");
      await fetchNotifications();
    }
  }

  function getMessage(notification: Notification) {
    switch (notification.type) {
      case "answer":
        return "Someone answered your question";
      case "question_comment":
        return "Someone commented on your question";
      case "answer_comment":
        return "Someone commented on an answer";
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => {
      if (open) void fetchNotifications();
    }}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
          />
        }
      >
        <Bell className="size-5" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-5 text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="font-semibold">Notifications</span>

          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void markAllAsRead()}
            >
              <CheckCheck className="mr-2 size-4" />
              Mark all read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading notifications...
          </div>
        ) : error && notifications.length === 0 ? (
          <div className="space-y-3 px-4 py-5 text-sm">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchNotifications()}
            >
              Try again
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">You're all caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">
              New answers and comments will appear here.
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.$id}
                disabled={updatingId === notification.$id}
                onClick={() => void openNotification(notification)}
                className="flex cursor-pointer items-start gap-3 whitespace-normal px-3 py-3"
              >
                <span className="mt-0.5 rounded-full bg-muted p-2">
                  {updatingId === notification.$id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MessageSquare className="size-4" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-5">
                    {getMessage(notification)}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {new Date(notification.$createdAt).toLocaleString()}
                  </span>
                </span>

                {!notification.isRead && (
                  <span
                    className="mt-2 size-2 shrink-0 rounded-full bg-primary"
                    aria-label="Unread"
                  />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {error && notifications.length > 0 && (
          <p role="alert" className="px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
