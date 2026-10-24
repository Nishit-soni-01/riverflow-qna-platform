import { Permission, Role } from "node-appwrite";

import { db, questionTable } from "../name";
import { tablesDB } from "./config";

export default async function createQuestionTable() {
  // Create Questions table
  await tablesDB.createTable({
    databaseId: db,
    tableId: questionTable,
    name: "Questions",
    permissions: [
      Permission.read(Role.any()),
    ],
    rowSecurity: true,
  });

  console.log("Question table created");

  // Create columns
  await Promise.all([
    tablesDB.createVarcharColumn({
      databaseId: db,
      tableId: questionTable,
      key: "title",
      size: 100,
      required: true,
    }),

    tablesDB.createMediumtextColumn({
      databaseId: db,
      tableId: questionTable,
      key: "content",
      required: true,
    }),

    tablesDB.createVarcharColumn({
      databaseId: db,
      tableId: questionTable,
      key: "authorId",
      size: 50,
      required: true,
    }),

    tablesDB.createVarcharColumn({
      databaseId: db,
      tableId: questionTable,
      key: "tags",
      size: 50,
      required: true,
      array: true,
    }),

    tablesDB.createVarcharColumn({
      databaseId: db,
      tableId: questionTable,
      key: "attachmentId",
      size: 50,
      required: false,
    }),
  ]);

  console.log("Question table columns created");
}
