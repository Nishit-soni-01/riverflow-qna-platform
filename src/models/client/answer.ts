import { ID, Permission, Role } from "appwrite";
import { account, tablesDB } from "./config";
import { answerTable, db } from "../name";

export interface Answer {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  content: string;
  questionId: string;
  authorId: string;
}

export async function getAnswers(questionId: string) {
  const response = await tablesDB.listRows({
    databaseId: db,
    tableId: answerTable,
    queries: [],
  });

  return response.rows
    .filter((row) => row.questionId === questionId)
    .sort(
      (a, b) =>
        new Date(a.$createdAt).getTime() -
        new Date(b.$createdAt).getTime()
    ) as unknown as Answer[];
}

export async function createAnswer(
  questionId: string,
  content: string
) {
  const cleanContent = content.trim();

  if (!cleanContent) {
    throw new Error("Please write an answer before submitting.");
  }

  const user = await account.get();

  return tablesDB.createRow({
    databaseId: db,
    tableId: answerTable,
    rowId: ID.unique(),
    data: {
      content: cleanContent,
      questionId,
      authorId: user.$id,
    },
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ],
  });
}