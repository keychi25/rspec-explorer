# GitHub 公開運用セットアップ

このドキュメントは、リポジトリを一般公開して継続運用するために GitHub 側で設定しておきたい項目をまとめたものです。

コードとして管理できるものは `.github/` に追加し、GitHub UI でしか設定できないものはここに手順を残しています。

## このリポジトリで追加したもの

- `Bug report` issue form
- `Feature request` issue form
- issue 作成導線の設定（`blank_issues_enabled: false`）
- `pull_request_template.md`
- `CODEOWNERS`
- `SECURITY.md`

## 1. Branch protection / Ruleset

GitHub の `Settings` -> `Rules` -> `Rulesets` から、`master` 向けの ruleset を作成します。

推奨設定:

- Target branches: `master`
- Require a pull request before merging
- Require approvals: `1`
- Dismiss stale approvals when new commits are pushed
- Require status checks to pass before merging
- Required status check: `test`
- Require conversation resolution before merging
- Block force pushes
- Block branch deletion

補足:

- このリポジトリの CI ワークフローでは、保護対象にしやすいよう job 名を `test` にしています
- `CODEOWNERS` を使っているため、必要に応じて `Require review from Code Owners` も有効化できます

## 2. Release 運用

このリポジトリでは `.github/workflows/release.yml` により、`v*` タグ push を起点に以下を自動化しています。

- version と tag の整合性チェック
- リリース前検証
- VSIX の生成
- GitHub Release 作成
- VS Code Marketplace への publish

公開前に GitHub 側で確認すること:

- `Actions` が有効
- Repository secret `VSCE_PAT` が設定済み
- 必要なら Repository variable `MARKETPLACE_PRERELEASE=true`

## 3. 障害報告フロー

公開後に利用者が迷わないよう、以下の導線を用意します。

- 不具合: `Bug report` issue form
- 改善要望: `Feature request` issue form
- 使い方の相談: GitHub Discussions
- セキュリティ問題: 公開 issue ではなく private report

GitHub 側で追加で行うこと:

- `Settings` -> `General` -> `Features` で `Discussions` を有効化
- `Settings` -> `Security` で private vulnerability reporting を有効化

## 4. 推奨ラベル

最低限、次のラベルを用意しておくと triage しやすくなります。

- `bug`
- `enhancement`
- `question`
- `release`
- `needs-repro`

## 5. 初回公開前チェック

- `README.md` が利用者向けになっている
- `LICENSE` を公開方針に合わせて見直している
- `package.json` の `private` / `license` / `repository` を公開方針に合わせて見直している
- `pnpm -s prepublish:verify` が成功する
- `VSCE_PAT` が設定されている
- `master` の branch protection/ruleset が有効
