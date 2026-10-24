import { Permission, Role } from "node-appwrite";

import { voteTable, db } from "../name";
import { tablesDB } from "./config";

export default async function createVoteTable() {
  // Create Votes table
  await tablesDB.createTable({
    databaseId: db,
    tableId: voteTable,
    name: "Votes",
    permissions: [
      Permission.read(Role.any()),
    ],
    rowSecurity: true,
  });

  console.log("Vote table created");

  // Create columns
  await Promise.all([
    tablesDB.createEnumColumn({
      databaseId: db,
      tableId: voteTable,
      key: "type",
      elements: ["question", "answer"],
      required: true,
    }),

    tablesDB.createVarcharColumn({
      databaseId: db,
      tableId: voteTable,
      key: "typeId",
      size: 50,
      required: true,
    }),

    tablesDB.createEnumColumn({
      databaseId: db,
      tableId: voteTable,
      key: "voteStatus",
      elements: ["upvoted", "downvoted"],
      required: true,
    }),

    tablesDB.createVarcharColumn({
      databaseId: db,
      tableId: voteTable,
      key: "votedById",
      size: 50,
      required: true,
    }),
  ]);

  console.log("Vote table columns created");
}