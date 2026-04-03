import fs from "node:fs";
import path from "node:path";
import {
  getPublicAppUrlSyncState,
  getRequiredPublicAppUrl,
  resolvePublicAppUrl,
} from "../app/config.server.js";

const cwd = process.cwd();
const extensionAppUrlPath = path.join(
  cwd,
  "extensions",
  "my-post-purchase-ui-extension",
  "src",
  "app-url.js"
);
const extensionDistPath = path.join(
  cwd,
  "extensions",
  "my-post-purchase-ui-extension",
  "dist",
  "my-post-purchase-ui-extension.js"
);
const forbiddenTokens = ["https://example.com", "example.com", ".invalid"];
const includeBuiltArtifacts = process.argv.includes("--include-built");

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function extractAppUrl(moduleSource) {
  const match = moduleSource?.match(/APP_URL = "([^"]+)"/);
  return match?.[1] || null;
}

function collectForbiddenMatches(filePath) {
  const contents = readTextFile(filePath);

  if (!contents) {
    return [];
  }

  return forbiddenTokens.filter((token) => contents.includes(token));
}

const resolution = resolvePublicAppUrl();
const appUrl = getRequiredPublicAppUrl("public URL validation");
const syncState = getPublicAppUrlSyncState();
const extensionAppUrlSource = readTextFile(extensionAppUrlPath);
const extensionAppUrl = extractAppUrl(extensionAppUrlSource);
const errors = [];

if (
  resolution.source !== "PUBLIC_APP_URL" &&
  resolution.source !== "SHOPIFY_APP_URL" &&
  resolution.source !== "HOST"
) {
  errors.push("No supported public app URL source was selected.");
}

if (extensionAppUrl !== appUrl) {
  errors.push(
    `Extension APP_URL mismatch. Expected ${appUrl}, found ${
      extensionAppUrl || "missing"
    } in ${extensionAppUrlPath}.`
  );
}

if (!syncState) {
  errors.push(
    "Missing .shopify/public-url-sync.json. Run npm run sync:app-url."
  );
} else {
  if (syncState.appUrl !== appUrl) {
    errors.push(
      `Synced URL metadata mismatch. Expected ${appUrl}, found ${syncState.appUrl}.`
    );
  }
}

const filesToCheck = [extensionAppUrlPath];

if (includeBuiltArtifacts) {
  filesToCheck.push(extensionDistPath);
}

if (includeBuiltArtifacts) {
  const extensionDist = readTextFile(extensionDistPath);

  if (!extensionDist) {
    errors.push(`Missing extension bundle at ${extensionDistPath}.`);
  } else if (!extensionDist.includes(appUrl)) {
    errors.push(
      `Extension bundle does not contain the resolved APP_URL ${appUrl}.`
    );
  }
}

for (const filePath of filesToCheck) {
  const matches = collectForbiddenMatches(filePath);

  if (matches.length > 0) {
    errors.push(
      `Forbidden placeholder token(s) ${matches.join(
        ", "
      )} found in ${path.relative(cwd, filePath)}.`
    );
  }
}

if (errors.length > 0) {
  console.error("[public-app-url] validation failed");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `[public-app-url] validation passed url=${appUrl} source=${
    resolution.source || "unknown"
  }`
);
