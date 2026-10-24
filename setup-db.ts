import { config } from "dotenv";
import "dotenv/config";

config();

import getOrCreateDB from "./src/models/server/dbSetup";

async function main() {
  await getOrCreateDB();
  console.log("Database setup completed!");
}

main().catch((error) => {
  console.error("Database setup failed:", error);
  process.exitCode = 1;
});