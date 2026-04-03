import { PrismaClient } from "@prisma/client";
import {
  applyLocalDatabaseDefaults,
  assertLocalDatabaseState,
} from "./config.server";

const database = applyLocalDatabaseDefaults();
const bootstrapCheck = assertLocalDatabaseState();

if (database.mode === "sqlite") {
  console.log(`Resolved runtime DB path: ${database.resolvedPath}`);
  console.log(
    `Resolved bootstrap DB path: ${bootstrapCheck.bootstrapState?.resolvedPath}`
  );
}

let db;

if (process.env.NODE_ENV !== "production") {
  if (!global.__db) {
    global.__db = new PrismaClient();
  }
  db = global.__db;
} else {
  db = new PrismaClient();
}

export default db;
