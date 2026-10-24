import { Permission, Role } from "node-appwrite";

import { answerTable, db } from "../name";
import { tablesDB } from "./config";

export default async function createAnswerTable() {
  // Create Answers table
  await tablesDB.createTable({
    databaseId: db,
    tableId: answerTable,
    name: "Answers",
    permissions: [
      Permission.read(Role.any()),
    ],
    rowSecurity: true,
  });

  console.log("Answer table created");

  // Create columns
  await Promise.all([
    tablesDB.createMediumtextColumn({
      databaseId: db,
      tableId: answerTable,
      key: "content",
      required: true,
    }),

    tablesDB.createVarcharColumn({
      databaseId: db,
      tableId: answerTable,
      key: "questionId",
      size: 50,
      required: true,
    }),

    tablesDB.createVarcharColumn({
      databaseId: db,
      tableId: answerTable,
      key: "authorId",
      size: 50,
      required: true,
    }),
  ]);

  console.log("Answer table columns created");
}
