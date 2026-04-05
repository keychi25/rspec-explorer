#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    fail(`${relativePath} is missing.`);
  }

  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
  }
}

function bumpPatch(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    fail(`Unsupported version format: ${version}`);
  }

  const [, major, minor, patch] = match;
  return `${major}.${minor}.${Number(patch) + 1}`;
}

function updateChangelog(content, nextVersion) {
  const header = `## ${nextVersion}`;
  if (content.includes(header)) {
    return content;
  }

  const bulletLines = [
    "- Automated release prepared from `master`.",
    "- Review merged changes in GitHub pull requests and commit history before publishing.",
  ].join("\n");

  const block = `${header}\n\n${bulletLines}\n\n`;
  if (content.startsWith("# Changelog\n\n")) {
    return content.replace("# Changelog\n\n", `# Changelog\n\n${block}`);
  }

  return `${block}${content}`;
}

const packageJson = readJson("package.json");
const currentVersion = packageJson.version;
const nextVersion = bumpPatch(currentVersion);

packageJson.version = nextVersion;
fs.writeFileSync(
  path.join(root, "package.json"),
  `${JSON.stringify(packageJson, null, 2)}\n`,
  "utf8",
);

const changelogPath = path.join(root, "CHANGELOG.md");
if (!fs.existsSync(changelogPath)) {
  fail("CHANGELOG.md is missing.");
}

const changelog = fs.readFileSync(changelogPath, "utf8");
fs.writeFileSync(changelogPath, updateChangelog(changelog, nextVersion), "utf8");
fs.writeFileSync(path.join(root, ".release-version"), `${nextVersion}\n`, "utf8");

console.log(`Prepared release version ${nextVersion}`);
