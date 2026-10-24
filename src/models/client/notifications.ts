
import { account } from "@/models/client/config";

export type NotificationEvent =
  | "answer"
  | "question_comment"
  | "answer_comment";

export async function createNotification(
  type: NotificationEvent,
  targetId: string
) {
  // Get a JWT for the currently logged-in Appwrite user.
  const jwtResponse = await account.createJWT();

  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtResponse.jwt}`,
    },
    body: JSON.stringify({ type, targetId }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);

    throw new Error(
      result?.error ?? "Failed to create notification."
    );
  }

  return response.json() as Promise<{ created: boolean }>;
}
