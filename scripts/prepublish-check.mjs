#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const errors = [];
const warnings = [];
const infos = [];

const semverPattern = /^\d+\.\d+\.\d+([-.][0-9A-Za-z.-]+)?$/;

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    errors.push(`${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

function hasNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

const packageJson = readJson("package.json");

if (!fileExists("README.md")) {
  errors.push("README.md is missing.");
}

if (!fileExists("LICENSE") && !fileExists("LICENSE.txt")) {
  warnings.push("LICENSE file is missing.");
}

if (!fileExists("CHANGELOG.md")) {
  warnings.push("CHANGELOG.md is missing.");
}

if (!packageJson) {
  errors.push("package.json is missing.");
} else {
  infos.push("Detected VS Code extension project (package.json).");

  const requiredStringFields = [
    "name",
    "publisher",
    "displayName",
    "description",
    "version",
    "main",
  ];

  for (const field of requiredStringFields) {
    if (!hasNonEmptyString(packageJson[field])) {
      errors.push(`package.json: "${field}" must be a non-empty string.`);
    }
  }

  if (
    packageJson.engines === null ||
    typeof packageJson.engines !== "object" ||
    !hasNonEmptyString(packageJson.engines.vscode)
  ) {
    errors.push('package.json: "engines.vscode" must be set.');
  }

  if (!Array.isArray(packageJson.activationEvents) || packageJson.activationEvents.length === 0) {
    warnings.push('package.json: "activationEvents" is empty.');
  }

  if (!semverPattern.test(String(packageJson.version))) {
    errors.push('package.json: "version" should be semver (e.g. 1.2.3).');
  }

  const scripts = packageJson.scripts ?? {};
  for (const script of ["check", "lint", "test", "package", "publish"]) {
    if (!hasNonEmptyString(scripts[script])) {
      warnings.push(`package.json: script "${script}" is missing.`);
    }
  }

  const files = Array.isArray(packageJson.files) ? packageJson.files : [];
  for (const requiredEntry of ["out/**", "README.md", "package.json"]) {
    if (!files.includes(requiredEntry)) {
      warnings.push(`package.json: "files" should include "${requiredEntry}".`);
    }
  }

  if (packageJson.private === true) {
    warnings.push('package.json: "private" is true. Keep this if intentional for npm; it does not block VSIX packaging.');
  }

  if (packageJson.publisher === "local") {
    warnings.push('package.json: "publisher" is "local". Replace with your Marketplace publisher id before release.');
  }
}

console.log("Prepublish check report");
console.log("=======================");
for (const info of infos) {
  console.log(`- INFO: ${info}`);
}

if (warnings.length > 0) {
  console.log("\nWarnings");
  console.log("--------");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.log("\nErrors");
  console.log("------");
  for (const error of errors) {
    console.log(`- ${error}`);
  }
  process.exit(1);
}

console.log("\nNo blocking errors found.");
