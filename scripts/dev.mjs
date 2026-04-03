import { spawn } from "node:child_process";
import { loadLocalEnv } from "./load-local-env.mjs";
import {
  getRequiredPublicAppUrl,
  resolvePublicAppUrl,
} from "../app/config.server.js";

loadLocalEnv();

const resolution = resolvePublicAppUrl();
const appUrl = getRequiredPublicAppUrl("dev startup");

if (!process.env.PUBLIC_APP_URL) {
  process.env.PUBLIC_APP_URL = appUrl;
}

process.env.SHOPIFY_APP_URL = appUrl;
process.env.EFFECTIVE_PUBLIC_APP_URL = appUrl;
process.env.EFFECTIVE_PUBLIC_APP_URL_SOURCE = resolution.source || "";

console.log(
  `[public-app-url] resolved ${appUrl} from ${resolution.source || "unknown"}`
);

await import("./sync-app-url.mjs");

const vite = spawn("vite", ["dev"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

vite.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
