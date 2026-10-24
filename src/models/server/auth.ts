
import { Account, Client } from "node-appwrite";
import env from "@/app/env";

export async function getAuthenticatedUser(jwt: string) {
  if (!jwt || jwt.length > 4096) {
    throw new Error("UNAUTHORIZED");
  }

  const client = new Client()
    .setEndpoint(env.appwrite.endpoint)
    .setProject(env.appwrite.projectId)
    .setJWT(jwt);

  const account = new Account(client);

  try {
    return await account.get();
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}
