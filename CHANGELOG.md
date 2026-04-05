# Changelog

## 0.0.9

- Automated release prepared from `master`.
- Review merged changes in GitHub pull requests and commit history before publishing.

## 0.0.8

- Automated release prepared from `master`.
- Review merged changes in GitHub pull requests and commit history before publishing.

## 0.0.7

- Automated release prepared from `master`.
- Review merged changes in GitHub pull requests and commit history before publishing.

## 0.0.6

- Automated release prepared from `master`.
- Review merged changes in GitHub pull requests and commit history before publishing.

## 0.0.5

- Added GitHub Actions CI workflow for typecheck/lint/test.
- Added release workflow to create GitHub Releases, attach the built VSIX, and publish to the VS Code Marketplace.
- Added CI/CD documentation (`docs/CI_CD.md`).
- Note: Marketplace does not accept semver prerelease suffixes in `version` (for example `0.0.5-rc1`). Use a normal version like `0.0.5` and publish pre-releases with `vsce publish --pre-release` (see `docs/CI_CD.md`).

## 0.0.4

- Lowered the minimum VS Code engine requirement to `^1.80.0` (was `^1.105.0`).
- Aligned `@types/vscode` with `1.80.0` to match the engine.
- Added `esbuild` to pnpm `ignoredBuiltDependencies` in the workspace config.

## 0.0.3

- Added extension icon.
- Added Marketplace metadata (categories/keywords), including the "rspec" tag.

## 0.0.1

- Initial release candidate.
- Added prepublish validation scripts and checklist documentation.
- Added production release scripts (`release:prod:check`, `release:prod`).
- Updated README for Marketplace (extension description only); moved development/release notes to `docs/DEVELOPMENT.md`.
