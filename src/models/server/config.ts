import "dotenv/config";
import env from "@/app/env";

import {
  Avatars,
  Client,
  TablesDB,
  Storage,
  Users,
} from "node-appwrite";

// Guard: this file holds the secret key and must never run in the browser.
if (typeof window !== "undefined") {
  throw new Error("models/server/config.ts must only be imported on the server.");
}

const apikey = process.env.APPWRITE_API_KEY;

if (!apikey) {
  throw new Error("Missing APPWRITE_API_KEY. Check your .env file.");
}

const client = new Client()
  .setEndpoint(env.appwrite.endpoint)
  .setProject(env.appwrite.projectId)
  .setKey(apikey);

const tablesDB = new TablesDB(client);
const avatars = new Avatars(client);
const storage = new Storage(client);
const users = new Users(client);

export { client, tablesDB, users, avatars, storage };