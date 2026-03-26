#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const root = process.cwd();
const args = new Set(process.argv.slice(2));

const allowDirty = args.has("--allow-dirty");
const skipPublisherCheck = args.has("--skip-publisher-check");
const skipTokenCheck = args.has("--skip-token-check");

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

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty string.`);
  }
}

const packageJson = readJson("package.json");
const changelogPath = path.join(root, "CHANGELOG.md");

assertNonEmptyString(packageJson.name, "package.json:name");
assertNonEmptyString(packageJson.publisher, "package.json:publisher");
assertNonEmptyString(packageJson.version, "package.json:version");

if (!skipPublisherCheck && packageJson.publisher === "local") {
  fail('package.json:publisher is "local". Set your production publisher id before release.');
}

if (!skipTokenCheck && !process.env.VSCE_PAT) {
  fail("VSCE_PAT is not set. Export VSCE_PAT before running production publish.");
}

if (!fs.existsSync(changelogPath)) {
  fail("CHANGELOG.md is missing.");
}

const changelog = fs.readFileSync(changelogPath, "utf8");
const versionHeader = `## ${packageJson.version}`;
if (!changelog.includes(versionHeader)) {
  fail(`CHANGELOG.md does not include "${versionHeader}".`);
}

if (!allowDirty) {
  try {
    const status = execSync("git status --porcelain", { cwd: root, encoding: "utf8" }).trim();
    if (status.length > 0) {
      fail("Working tree is dirty. Commit or stash changes before production publish.");
    }
  } catch (error) {
    fail(`Failed to check git status: ${error.message}`);
  }
}

console.log("Production release checks passed.");
