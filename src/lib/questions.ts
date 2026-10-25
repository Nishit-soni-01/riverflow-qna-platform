
import { Query } from "node-appwrite";

import { tablesDB, users } from "@/models/server/config";
import { db, questionTable, voteTable } from "@/models/name";

export type Sort = "newest" | "active" | "top";

export interface Question {
  $id: string;
  title: string;
  excerpt: string;
  tags: string[];
  votes: number;
  answers: number;
  views: number;
  authorId: string;
  authorName: string;
  solved: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export const POPULAR_TAGS = [
  { name: "javascript", count: 18420 },
  { name: "react", count: 12904 },
  { name: "python", count: 11870 },
  { name: "nextjs", count: 5210 },
  { name: "sql", count: 4980 },
  { name: "typescript", count: 4410 },
  { name: "tailwindcss", count: 2310 },
  { name: "appwrite", count: 860 },
];

interface QuestionRow {
  $id: string;
  title: string;
  content: string;
  authorId: string;
  tags?: string[];
  acceptedAnswerId?: string | null;
  $createdAt: string;
  $updatedAt: string;
}
interface VoteRow {
  type: "question" | "answer";
  typeId: string;
  voteStatus: "upvoted" | "downvoted";
}




export async function getQuestions(opts: {
  sort?: Sort;
  q?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: Question[]; total: number }> {
  const {
    sort = "newest",
    q,
    tag,
    page = 1,
    pageSize = 20,
  } = opts;

  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

  // Build database filters.
  const filters: string[] = [];
  const searchTerm = q?.trim();
  const tagName = tag?.trim();

  // if (searchTerm) {
  //   filters.push(
  //     Query.or([
  //       Query.search("title", searchTerm),
  //       Query.search("content", searchTerm),
  //     ])
  //   );
  // }

  if (searchTerm) {
  filters.push(Query.search("title", searchTerm));
}

  if (tagName) {
    filters.push(Query.containsAny("tags", [tagName]));
  }

  // Fetch matching questions in batches so pagination and Top voted
  // sorting consider all matching questions, not just the first 100.
  const rows: QuestionRow[] = [];
  const batchSize = 100;
  let offset = 0;

  while (true) {
    const queries = [...filters];

    if (sort === "active") {
      queries.push(Query.orderDesc("$updatedAt"));
    } else {
      queries.push(Query.orderDesc("$createdAt"));
    }

    queries.push(Query.limit(batchSize), Query.offset(offset));

    const response = await tablesDB.listRows({
      databaseId: db,
      tableId: questionTable,
      queries,
    });

    const batch = response.rows as unknown as QuestionRow[];
    rows.push(...batch);

    if (batch.length < batchSize) {
      break;
    }

    offset += batch.length;
  }

  // Fetch question votes in batches.
  const voteRows: VoteRow[] = [];
  const voteBatchSize = 100;
  let voteOffset = 0;

  while (true) {
    const voteResponse = await tablesDB.listRows({
      databaseId: db,
      tableId: voteTable,
      queries: [
        Query.equal("type", "question"),
        Query.limit(voteBatchSize),
        Query.offset(voteOffset),
      ],
    });

    const batch = voteResponse.rows as unknown as VoteRow[];
    voteRows.push(...batch);

    if (batch.length < voteBatchSize) {
      break;
    }

    voteOffset += batch.length;
  }

  const voteScores = new Map<string, number>();

  for (const vote of voteRows) {
    const currentScore = voteScores.get(vote.typeId) ?? 0;

    voteScores.set(
      vote.typeId,
      currentScore + (vote.voteStatus === "upvoted" ? 1 : -1)
    );
  }

  // Resolve author names.
  const authorNames = new Map<string, string>();

  await Promise.all(
    [...new Set(rows.map((row) => row.authorId))].map(async (authorId) => {
      try {
        const user = await users.get({ userId: authorId });
        authorNames.set(authorId, user.name || "Riverflow user");
      } catch {
        authorNames.set(authorId, "Riverflow user");
      }
    })
  );

  let items: Question[] = rows.map((row) => ({
    $id: row.$id,
    title: row.title,
    excerpt: row.content.slice(0, 220),
    tags: row.tags ?? [],
    votes: voteScores.get(row.$id) ?? 0,
    answers: 0,
    views: 0,
    authorId: row.authorId,
    authorName: authorNames.get(row.authorId) ?? "Riverflow user",
    solved: Boolean(row.acceptedAnswerId),
    $createdAt: row.$createdAt,
    $updatedAt: row.$updatedAt,
  }));

  // Sort all matching results before slicing the requested page.
  items.sort((a, b) => {
    if (sort === "active") {
      return b.$updatedAt.localeCompare(a.$updatedAt);
    }

    if (sort === "top") {
      return b.votes - a.votes;
    }

    return b.$createdAt.localeCompare(a.$createdAt);
  });

  const total = items.length;
  const start = (safePage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    total,
  };
}

