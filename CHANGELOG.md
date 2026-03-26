# Changelog

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
