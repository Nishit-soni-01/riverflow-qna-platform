
import { Query } from "node-appwrite";

import { tablesDB, users } from "@/models/server/config";
import { db, questionTable } from "@/models/name";

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

export async function getQuestions(opts: {
  sort?: Sort;
  q?: string;
  tag?: string;
}): Promise<{ items: Question[]; total: number }> {
  const { sort = "newest", q, tag } = opts;

  const response = await tablesDB.listRows({
    databaseId: db,
    tableId: questionTable,
    queries: [
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ],
  });

  const rows = response.rows as unknown as QuestionRow[];

  // Resolve author names from Appwrite, without exposing private user data.
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
    votes: 0,
    answers: 0,
    views: 0,
    authorId: row.authorId,
    authorName: authorNames.get(row.authorId) ?? "Riverflow user",
    solved: Boolean(row.acceptedAnswerId),
    $createdAt: row.$createdAt,
    $updatedAt: row.$updatedAt,
  }));

  if (q?.trim()) {
    const needle = q.trim().toLowerCase();

    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.excerpt.toLowerCase().includes(needle)
    );
  }

  if (tag?.trim()) {
    items = items.filter((item) =>
      item.tags.some((itemTag) =>
        itemTag.toLowerCase() === tag.trim().toLowerCase()
      )
    );
  }

  items.sort((a, b) => {
    if (sort === "active") {
      return b.$updatedAt.localeCompare(a.$updatedAt);
    }

    if (sort === "top") {
      return b.votes - a.votes;
    }

    return b.$createdAt.localeCompare(a.$createdAt);
  });

  return { items, total: items.length };
}
