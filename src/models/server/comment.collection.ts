import { Permission, Role } from "node-appwrite";

import { commentTable, db } from "../name";
import { tablesDB } from "./config";

export default async function createCommentTable() {
  // Create Comments table
  await tablesDB.createTable({
    databaseId: db,
    tableId: commentTable,
    name: "Comments",
    permissions: [
      Permission.read(Role.any()),
    ],
    rowSecurity: true,
  });

  console.log("Comment table created");

  // Create columns
  await Promise.all([
    tablesDB.createMediumtextColumn({
      databaseId: db,
      tableId: commentTable,
      key: "content",
      required: true,
    }),

    tablesDB.createEnumColumn({
      databaseId: db,
      tableId: commentTable,
      key: "type",
      elements: ["answer", "question"],
      required: true,
    }),

    tablesDB.createVarcharColumn({
      databaseId: db,
      tableId: commentTable,
      key: "typeId",
      size: 50,
      required: true,
    }),

    tablesDB.createVarcharColumn({
      databaseId: db,
      tableId: commentTable,
      key: "authorId",
      size: 50,
      required: true,
    }),
  ]);

  console.log("Comment table columns created");
}
