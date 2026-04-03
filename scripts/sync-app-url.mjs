import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  getPublicUrlSyncStatePath,
  resolveExtensionAppUrl,
  getRequiredExtensionAppUrl,
} from "../app/config.server.js";

const cwd = process.cwd();
const generatedDir = path.join(cwd, ".shopify", "generated");
const extensionAppUrlPath = path.join(generatedDir, "app-url.js");
const extensionSourceGeneratedDir = path.join(
  cwd,
  "extensions",
  "my-post-purchase-ui-extension",
  "src",
  "generated"
);
const extensionSourceAppUrlPath = path.join(
  extensionSourceGeneratedDir,
  "app-url.js"
);
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

export function syncAppUrl() {
  const resolution = resolveExtensionAppUrl();
  const appUrl = getRequiredExtensionAppUrl("extension APP_URL sync");
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

  const shopifyGeneratedChanged = writeFileIfChanged(
    extensionAppUrlPath,
    appUrlModule
  );
  const extensionSourceChanged = writeFileIfChanged(
    extensionSourceAppUrlPath,
    appUrlModule
  );
  writeFileIfChanged(syncStatePath, syncState);

  return {
    appUrl,
    source: resolution.source || "unknown",
    syncedAt,
    changed: shopifyGeneratedChanged || extensionSourceChanged,
  };
}

const isMainModule =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const result = syncAppUrl();

  console.log(
    `[public-app-url] synced extension APP_URL=${result.appUrl} source=${
      result.source
    } changed=${result.changed ? "yes" : "no"} at=${result.syncedAt}`
  );
}
