
import { ID, Permission, Role } from "appwrite";
import { account, tablesDB } from "./config";
import { db, questionTable } from "../name";

export interface CreateQuestionInput {
  title: string;
  content: string;
  tags: string[];
}

export async function createQuestion(input: CreateQuestionInput) {
  const title = input.title.trim();
  const content = input.content.trim();
  const tags = [...new Set(input.tags.map((tag) => tag.trim().toLowerCase()))]
    .filter(Boolean);

  if (title.length < 15 || title.length > 100) {
    throw new Error("The title must be between 15 and 100 characters.");
  }

  if (content.length < 30) {
    throw new Error("Please provide more details about your question.");
  }

  if (tags.length === 0 || tags.length > 5) {
    throw new Error("Add between 1 and 5 tags.");
  }

  // Determine the author from the authenticated Appwrite session.
  const user = await account.get();

  return tablesDB.createRow({
    databaseId: db,
    tableId: questionTable,
    rowId: ID.unique(),
    data: {
      title,
      content,
      authorId: user.$id,
      tags,
    },
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ],
  });
}
