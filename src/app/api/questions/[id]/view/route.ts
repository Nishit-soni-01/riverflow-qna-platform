
import { NextResponse } from "next/server";
import { AppwriteException } from "node-appwrite";

import { getAuthenticatedUser } from "@/models/server/auth";
import { tablesDB } from "@/models/server/config";
import { db, questionTable } from "@/models/name";
import { questionViewRateLimit } from "@/lib/rate-limit";

function getJwt(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const jwt = getJwt(request);

    if (!jwt) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const user = await getAuthenticatedUser(jwt);

    const { id } = await context.params;

      if (
        !id ||
        id.length > 50 ||
        !/^[a-zA-Z0-9_-]+$/.test(id)
      ) {
        return NextResponse.json(
          { error: "Invalid question ID." },
          { status: 400 }
        );
      }

      const { success, reset } = await questionViewRateLimit.limit(
        user.$id
      );

      if (!success) {
        const retryAfter = Math.max(
          1,
          Math.ceil((reset - Date.now()) / 1000)
        );

        return NextResponse.json(
        {
            error: "Too many view requests. Please try again later.",
            retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
        },
      }
    );
  }

    

      const updatedRow = await tablesDB.incrementRowColumn({
        databaseId: db,
        tableId: questionTable,
        rowId: id,
        column: "views",
        value: 1,
      });

      const updatedQuestion = updatedRow as unknown as {
        views: number;
      };

      return NextResponse.json({ views: updatedQuestion.views });

  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Your session is invalid or expired. Please log in again." },
        { status: 401 }
      );
    }

    if (error instanceof AppwriteException) {
      console.error("Question view update failed:", {
        message: error.message,
        code: error.code,
        type: error.type,
      });
    } else {
      console.error("Question view update failed:", error);
    }

    return NextResponse.json(
      { error: "Unable to record question view." },
      { status: 500 }
    );
  }
}
