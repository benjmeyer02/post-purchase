import fs from "node:fs";
import path from "node:path";
import {
  getPublicUrlSyncStatePath,
  resolvePublicAppUrl,
  getRequiredPublicAppUrl,
} from "../app/config.server.js";

const cwd = process.cwd();
const extensionDir = path.join(
  cwd,
  "extensions",
  "my-post-purchase-ui-extension",
  "src"
);
const extensionAppUrlPath = path.join(extensionDir, "app-url.js");
const syncStatePath = getPublicUrlSyncStatePath();

function writeFileIfChanged(filePath, contents) {
  const existing = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf8")
    : null;

  if (existing === contents) {
    return false;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
  return true;
}

const resolution = resolvePublicAppUrl();
const appUrl = getRequiredPublicAppUrl("extension APP_URL sync");
const syncedAt = new Date().toISOString();
const appUrlModule = `export const APP_URL = ${JSON.stringify(appUrl)};\n`;
const syncState =
  JSON.stringify(
    {
      appUrl,
      source: resolution.source,
      syncedAt,
    },
    null,
    2
  ) + "\n";

const appUrlChanged = writeFileIfChanged(extensionAppUrlPath, appUrlModule);
writeFileIfChanged(syncStatePath, syncState);

console.log(
  `[public-app-url] synced extension APP_URL=${appUrl} source=${
    resolution.source || "unknown"
  } changed=${appUrlChanged ? "yes" : "no"} at=${syncedAt}`
);
