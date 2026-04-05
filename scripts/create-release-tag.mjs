#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const shouldPush = args.has("--push");
const dryRun = args.has("--dry-run");

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function run(command) {
  try {
    return execSync(command, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    fail(error.stderr?.toString().trim() || error.message);
  }
}

function readPackageJson() {
  const filePath = path.join(root, "package.json");
  if (!fs.existsSync(filePath)) {
    fail("package.json is missing.");
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`package.json is not valid JSON: ${error.message}`);
  }
}

const packageJson = readPackageJson();
const version = packageJson.version;
const tagName = `v${version}`;

if (typeof version !== "string" || version.trim() === "") {
  fail("package.json version is missing.");
}

if (run(`git tag -l ${tagName}`) === tagName) {
  fail(`${tagName} already exists locally.`);
}

if (shouldPush && run(`git ls-remote --tags origin refs/tags/${tagName}`) !== "") {
  fail(`${tagName} already exists on origin.`);
}

const currentCommit = run("git rev-parse --short HEAD");

console.log(`Release tag: ${tagName}`);
console.log(`Target commit: ${currentCommit}`);

if (dryRun) {
  if (shouldPush) {
    console.log(`Dry run: would create and push ${tagName}.`);
  } else {
    console.log(`Dry run: would create ${tagName} locally.`);
  }
  process.exit(0);
}

run(`git tag -a ${tagName} -m "Release ${tagName}"`);
console.log(`Created local tag ${tagName}.`);

if (shouldPush) {
  run(`git push origin ${tagName}`);
  console.log(`Pushed ${tagName} to origin.`);
} else {
  console.log(`To trigger the Release workflow, run: git push origin ${tagName}`);
}
