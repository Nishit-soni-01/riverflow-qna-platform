
import { tablesDB } from "./config";
import { db, questionTable, answerTable, commentTable, voteTable } from "../name";

import createQuestionTable from "./question.collection";
import createAnswerTable from "./answer.collection";
import createCommentTable from "./comment.collection";
import createVoteTable from "./vote.collection";

async function tableExists(tableId: string): Promise<boolean> {
  try {
    await tablesDB.getTable({
      databaseId: db,
      tableId,
    });
    return true;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 404
    ) {
      return false;
    }
    throw error;
  }
}

export default async function getOrCreateDB() {
  const tables = [
    { id: questionTable, create: createQuestionTable },
    { id: answerTable, create: createAnswerTable },
    { id: commentTable, create: createCommentTable },
    { id: voteTable, create: createVoteTable },
  ];

  for (const table of tables) {
    if (await tableExists(table.id)) {
      console.log(`Table "${table.id}" already exists; skipping.`);
    } else {
      await table.create();
    }
  }

  console.log("TablesDB setup completed.");
  return tablesDB;
}
