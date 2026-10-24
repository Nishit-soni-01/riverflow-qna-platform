
import { NextResponse } from "next/server";
import { AppwriteException, Query } from "node-appwrite";

import { users, tablesDB } from "@/models/server/config";
import { db, questionTable, answerTable } from "@/models/name";
import env from "@/app/env";

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

function getBadge(reputation: number): "Beginner" | "Contributor" | "Expert" {
  if (reputation >= 200) return "Expert";
  if (reputation >= 50) return "Contributor";
  return "Beginner";
}

async function calculateReputation(userId: string) {
  const [questions, answers] = await Promise.all([
    listAllRows<QuestionRow>(questionTable, [
      Query.equal("authorId", userId),
    ]),
    listAllRows<AnswerRow>(answerTable, [
      Query.equal("authorId", userId),
    ]),
  ]);

  const targets = [
    ...questions.map((row) => ({
      id: row.$id,
      type: "question" as const,
    })),
    ...answers.map((row) => ({
      id: row.$id,
      type: "answer" as const,
    })),
  ];

  const results = await Promise.all(
    targets.map(async (target) => {
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

  for (const result of results) {
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

  return {
    reputation,
    badge: getBadge(reputation),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length > 50) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const user = await users.get({ userId: id });
    
    const { reputation, badge } = await calculateReputation(id);

    const endpoint = env.appwrite.endpoint.replace(/\/+$/, "");
    const avatarUrl = new URL(`${endpoint}/avatars/initials`);

    avatarUrl.searchParams.set("name", user.name || "Riverflow User");
    avatarUrl.searchParams.set("width", "128");
    avatarUrl.searchParams.set("height", "128");
    avatarUrl.searchParams.set("background", "00B887");
    avatarUrl.searchParams.set("color", "FFFFFF");

    return NextResponse.json(
      {
        id: user.$id,
        name: user.name || "Riverflow User",
        avatarUrl: avatarUrl.toString(),
        reputation,
        badge,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.error("Failed to load public profile:", error);

    return NextResponse.json(
      { error: "Unable to load profile" },
      { status: 500 }
    );
  }
}
