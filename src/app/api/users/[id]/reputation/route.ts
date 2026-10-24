
import { NextResponse } from "next/server";
import { AppwriteException, Query } from "node-appwrite";

import { getAuthenticatedUser } from "@/models/server/auth";
import { tablesDB } from "@/models/server/config";
import {
  db,
  questionTable,
  answerTable,
} from "@/models/name";

const VOTES_TABLE = "votes";
const PAGE_SIZE = 100;

type VoteType = "question" | "answer";
type VoteStatus = "upvoted" | "downvoted";

interface QuestionRow {
  $id: string;
  authorId: string;
  acceptedAnswerId?: string | null;
}

interface AnswerRow {
  $id: string;
  authorId: string;
  questionId: string;
}

interface VoteRow {
  $id: string;
  type: VoteType;
  typeId: string;
  votedById: string;
  voteStatus: VoteStatus;
}

async function listAllRows<T>(
  tableId: string,
  queries: string[] = []
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const response = await tablesDB.listRows({
      databaseId: db,
      tableId,
      queries: [
        ...queries,
        Query.limit(PAGE_SIZE),
        Query.offset(offset),
      ],
    });

    rows.push(...(response.rows as unknown as T[]));

    if (response.rows.length < PAGE_SIZE) break;
    offset += response.rows.length;
  }

  return rows;
}

function getBadge(reputation: number) {
  if (reputation >= 200) return "Expert";
  if (reputation >= 50) return "Contributor";
  return "Beginner";
}

function getJwt(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) return null;

  return authorization.slice(7).trim() || null;
}

export async function GET(
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

    await getAuthenticatedUser(jwt);

    const { id: userId } = await context.params;

    if (!userId || userId.length > 50) {
      return NextResponse.json(
        { error: "Invalid user ID." },
        { status: 400 }
      );
    }

    const [questions, answers] = await Promise.all([
      listAllRows<QuestionRow>(questionTable, [
        Query.equal("authorId", userId),
      ]),
      listAllRows<AnswerRow>(answerTable, [
        Query.equal("authorId", userId),
      ]),
    ]);

    const questionIds = questions.map((question) => question.$id);
    const answerIds = answers.map((answer) => answer.$id);

    const voteTargets = [
      ...questionIds.map((id) => ({ id, type: "question" as const })),
      ...answerIds.map((id) => ({ id, type: "answer" as const })),
    ];

    const voteResults = await Promise.all(
      voteTargets.map(async (target) => {
        const votes = await listAllRows<VoteRow>(VOTES_TABLE, [
          Query.equal("type", target.type),
          Query.equal("typeId", target.id),
        ]);

        return { ...target, votes };
      })
    );

    let questionUpvotes = 0;
    let questionDownvotes = 0;
    let answerUpvotes = 0;
    let answerDownvotes = 0;

    for (const result of voteResults) {
      for (const vote of result.votes) {
        if (vote.voteStatus === "upvoted") {
          if (result.type === "question") questionUpvotes++;
          else answerUpvotes++;
        } else if (vote.voteStatus === "downvoted") {
          if (result.type === "question") questionDownvotes++;
          else answerDownvotes++;
        }
      }
    }
    

    
    
      let acceptedAnswers = 0;

      for (const answer of answers) {
        const matchingQuestions = await listAllRows<QuestionRow>(
          questionTable,
          [Query.equal("acceptedAnswerId", answer.$id)]
        );

        if (matchingQuestions.length > 0) {
          acceptedAnswers++;
        }
      }


    const reputation =
      questionUpvotes * 5 -
      questionDownvotes * 2 +
      answerUpvotes * 10 -
      answerDownvotes * 2 +
      acceptedAnswers * 15;

    return NextResponse.json({
      userId,
      reputation,
      badge: getBadge(reputation),
      breakdown: {
        questionUpvotes,
        questionDownvotes,
        answerUpvotes,
        answerDownvotes,
        acceptedAnswers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Your session is invalid or expired. Please log in again." },
        { status: 401 }
      );
    }

    if (error instanceof AppwriteException) {
      console.error("Reputation API Appwrite error:", {
        message: error.message,
        code: error.code,
        type: error.type,
      });
    } else {
      console.error("Reputation API failed:", error);
    }

    return NextResponse.json(
      { error: "Unable to calculate reputation." },
      { status: 500 }
    );
  }
}
