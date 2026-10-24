
import { NextResponse } from "next/server";
import {
  AppwriteException,
  ID,
  Permission,
  Role,
} from "node-appwrite";

import { getAuthenticatedUser } from "@/models/server/auth";
import { tablesDB } from "@/models/server/config";
import {
  db,
  questionTable,
  answerTable,
  commentTable,
  notificationTable,
} from "@/models/name";

type NotificationType =
  | "answer"
  | "question_comment"
  | "answer_comment";

function getJwt(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user using their Appwrite JWT.
    const jwt = getJwt(request);

    if (!jwt) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const user = await getAuthenticatedUser(jwt);

    // 2. Validate the requested event.
    const body = await request.json().catch(() => null);

    if (
      !body ||
      !["answer", "question_comment", "answer_comment"].includes(body.type) ||
      typeof body.targetId !== "string" ||
      !body.targetId.trim() ||
      body.targetId.length > 50
    ) {
      return NextResponse.json(
        { error: "Invalid notification event." },
        { status: 400 }
      );
    }

    const type = body.type as NotificationType;
    const targetId = body.targetId.trim();

    let questionId = "";
    let recipientId = "";

    // 3. Look up the actual database records.
    if (type === "answer") {
      const answer = await tablesDB.getRow({
        databaseId: db,
        tableId: answerTable,
        rowId: targetId,
      });

      const answerData = answer as unknown as {
        $id: string;
        authorId: string;
        questionId: string;
      };

      // Only the person who posted this answer can trigger the event.
      if (answerData.authorId !== user.$id) {
        return NextResponse.json(
          { error: "You cannot trigger this event." },
          { status: 403 }
        );
      }

      questionId = answerData.questionId;

      const question = await tablesDB.getRow({
        databaseId: db,
        tableId: questionTable,
        rowId: questionId,
      });

      recipientId = (question as unknown as { authorId: string }).authorId;
    } else {
      const comment = await tablesDB.getRow({
        databaseId: db,
        tableId: commentTable,
        rowId: targetId,
      });

      const commentData = comment as unknown as {
        authorId: string;
        type: string;
        typeId: string;
      };

      // The authenticated user must be the comment's actual author.
      if (commentData.authorId !== user.$id) {
        return NextResponse.json(
          { error: "You cannot trigger this event." },
          { status: 403 }
        );
      }

      if (
        (type === "question_comment" && commentData.type !== "question") ||
        (type === "answer_comment" && commentData.type !== "answer")
      ) {
        return NextResponse.json(
          { error: "The comment type does not match the event." },
          { status: 400 }
        );
      }

      if (commentData.type === "question") {
        questionId = commentData.typeId;

        const question = await tablesDB.getRow({
          databaseId: db,
          tableId: questionTable,
          rowId: questionId,
        });

        recipientId = (question as unknown as { authorId: string }).authorId;
      } else {
        const answer = await tablesDB.getRow({
          databaseId: db,
          tableId: answerTable,
          rowId: commentData.typeId,
        });

        const answerData = answer as unknown as {
          authorId: string;
          questionId: string;
        };

        questionId = answerData.questionId;
        recipientId = answerData.authorId;
      }
    }

    // 4. Don't notify users about their own activity.
    if (!recipientId || recipientId === user.$id) {
      return NextResponse.json({ created: false });
    }
    // Diagnostic log
    console.log("Creating notification:", {
      recipientId,
      actorId: user.$id,
      type,
      questionId,
      targetId,
      isRead: false,
    });

    // 5. Create a notification readable/updatable only by its recipient.
    
    await tablesDB.createRow({
      databaseId: db,
      tableId: notificationTable,
      rowId: ID.unique(),
      data: {
        recipientId,
        actorId: user.$id,
        type: type as NotificationType,
        questionId,
        targetId,
        isRead: false,
      },
      permissions: [
        Permission.read(Role.user(recipientId)),
        Permission.update(Role.user(recipientId)),
      ],
    });

    return NextResponse.json({ created: true }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Your session is invalid or expired. Please log in again." },
        { status: 401 }
      );
    }

    if (error instanceof AppwriteException) {
      console.error("Notification Appwrite error:", {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response,
      });
    } else {
      console.error("Notification creation failed:", error);
    }

    return NextResponse.json(
      { error: "Unable to create notification." },
      { status: 500 }
    );
  }
}
