
import { ID, Permission, Query, Role } from "appwrite";
import { account, tablesDB } from "@/models/client/config";
import { db } from "@/models/name";

const VOTES_TABLE = "votes";

export type VoteType = "question" | "answer";
export type VoteStatus = "upvoted" | "downvoted";

interface VoteRow {
  $id: string;
  type: VoteType;
  typeId: string;
  votedById: string;
  voteStatus: VoteStatus;
}

export interface VoteSummary {
  upvotes: number;
  downvotes: number;
  myVote: VoteStatus | null;
}

async function listVotes(type: VoteType, typeId: string) {
  const result = await tablesDB.listRows({
    databaseId: db,
    tableId: VOTES_TABLE,
    queries: [
      Query.equal("type", type),
      Query.equal("typeId", typeId),
      Query.limit(500),
    ],
  });

  return result.rows as unknown as VoteRow[];
}

export async function getVoteSummary(
  type: VoteType,
  typeId: string
): Promise<VoteSummary> {
  const [votes, user] = await Promise.all([
    listVotes(type, typeId),
    account.get().catch(() => null),
  ]);

  return {
    upvotes: votes.filter((v) => v.voteStatus === "upvoted").length,
    downvotes: votes.filter((v) => v.voteStatus === "downvoted").length,
    myVote: user
      ? votes.find((v) => v.votedById === user.$id)?.voteStatus ?? null
      : null,
  };
}

export async function castVote(
  type: VoteType,
  typeId: string,
  voteStatus: VoteStatus
): Promise<void> {
  const user = await account.get();

  const result = await tablesDB.listRows({
    databaseId: db,
    tableId: VOTES_TABLE,
    queries: [
      Query.equal("type", type),
      Query.equal("typeId", typeId),
      Query.equal("votedById", user.$id),
      Query.limit(2),
    ],
  });

  const existingVotes = result.rows as unknown as VoteRow[];

  if (existingVotes.length > 1) {
    throw new Error(
      "Duplicate votes already exist for this item and user. Clean them up before voting again."
    );
  }

  const existing = existingVotes[0];

  if (existing?.voteStatus === voteStatus) {
    await tablesDB.deleteRow({
      databaseId: db,
      tableId: VOTES_TABLE,
      rowId: existing.$id,
    });
    return;
  }

  if (existing) {
    await tablesDB.updateRow({
      databaseId: db,
      tableId: VOTES_TABLE,
      rowId: existing.$id,
      data: { voteStatus },
    });
    return;
  }

  await tablesDB.createRow({
    databaseId: db,
    tableId: VOTES_TABLE,
    rowId: ID.unique(),
    data: {
      type,
      typeId,
      votedById: user.$id,
      voteStatus,
    },
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ],
  });
}
