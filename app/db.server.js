import { env } from "cloudflare:workers";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaD1(env.post_purchase_db);
const db = new PrismaClient({ adapter });

export default db;
