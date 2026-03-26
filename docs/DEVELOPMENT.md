# 開発者向けメモ（旧 README.md）

このファイルは、Marketplace 表示を意識して `README.md` を利用者向けに再構成する前に、元々 `README.md` に書いていた開発・リリース手順を退避したものです。

---

# RSpec Explorer for VS Code

RSpec のテストを VS Code のテストエクスプローラーおよびエディタのガター（行番号の横）から直接実行できる拡張機能です。

## ✅ 事前準備

### 必要なもの
- **Node.js**（拡張のビルド/デバッグ用）
- **pnpm**（依存関係のインストール用）
- **Ruby**（RSpec 実行用）
- **Bundler**（`bundle exec rspec` 実行用）

### セットアップ

```bash
pnpm install
pnpm run compile
```

## 🧪 CUIだけで変更確認する（推奨）

```bash
# 依存関係のインストール（ロック更新が必要な場合は --no-frozen-lockfile）
pnpm install --no-frozen-lockfile

# 拡張のビルド
pnpm -s check

# ユニットテスト（Vitest）
pnpm -s test

# サンプルRSpec（通常: 意図的失敗は除外して成功させる）
pnpm -s sample:setup
pnpm -s sample:test

# サンプルRSpec（意図的失敗も含めて失敗表示を確認）
pnpm -s sample:test:all

# VSIX 作成（ローカル配布用）
pnpm -s package
```

### Extension Development Host をCLIで起動

Cursor:

```bash
pnpm -s dev:cursor
```

VS Code:

```bash
pnpm -s dev:vscode
```

## ✅ 公開せず手元だけで確認する（macOS でも可）

### コマンドから起動する（Cursor / VS Code）

Cursor:

```bash
cursor --extensionDevelopmentPath="$(pwd)" "$(pwd)"
```

VS Code:

```bash
code --extensionDevelopmentPath="$(pwd)" "$(pwd)"
```

### VSIX を作ってローカルインストール

```bash
pnpm run package
```

```bash
# VS Code
code --install-extension ./rspec-explorer-0.0.1.vsix

# Cursor
cursor --install-extension ./rspec-explorer-0.0.1.vsix
```

## 📦 公開手順（拡張機能）

公開前に以下を実行します。

```bash
pnpm -s prepublish:verify
```

詳細チェック項目は `docs/prepublish-checklist.md` を参照してください。

本番公開は以下の 1 コマンドで実行できます（事前チェック + 公開）。

```bash
VSCE_PAT=xxxxx pnpm -s release:prod
```

`release:prod` は次を検証します。
- `package.json` の `publisher` が `local` でない
- `VSCE_PAT` が設定されている
- `CHANGELOG.md` に `## <package.json version>` がある
- git working tree が clean

## ✅ サンプルテストの実行（動作確認）

```bash
cd sample
bundle install
bundle exec rspec
```

