# RSpec Explorer for VS Code

RSpec のテストを VS Code のテストエクスプローラーおよびエディタのガター（行番号の横）から直接実行可能にする拡張機能です。

## ✅ 事前準備

### 必要なもの
- **Node.js**（拡張のビルド/デバッグ用）
- **pnpm**（依存関係のインストール用）
- **Ruby**（RSpec 実行用）
- **Bundler**（`bundle exec rspec` 実行用）

### セットアップ

依存関係をインストールしてビルドします。

```bash
pnpm install
pnpm run compile
```

## 🧪 CUIだけで変更確認する（推奨）

GUIでリロード操作をしない前提で、変更が正しく反映されているかをCUIで確認するためのコマンドです。

### よく使う実行コマンド

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

### 拡張のビルド（単発）

```bash
pnpm -s check
```

### 拡張のビルド（監視）

```bash
pnpm -s watch
```

### サンプルRSpec（`sample/`）のセットアップと実行

```bash
pnpm -s sample:setup
pnpm -s sample:test
```

意図的に失敗するテスト（`:intentional_failure`）も含めて動作確認したい場合:

```bash
pnpm -s sample:test:all
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

## ▶️ 拡張の起動（デバッグ実行）

この拡張は Extension Development Host で動作確認できます。

## ✅ 公開せず手元だけで確認する（macOS でも可）

Marketplace へ公開しなくても、以下の方法で手元確認できます（macOS 含め対応）。

#### コマンドから起動する（Cursor / VS Code）

ターミナルから Extension Development Host を起動できます。

Cursor:

```bash
cursor --extensionDevelopmentPath="$(pwd)" "$(pwd)"
```

VS Code:

```bash
code --extensionDevelopmentPath="$(pwd)" "$(pwd)"
```

### 方法2: VSIX を作ってローカルインストール

- VSIX を作成する

```bash
pnpm run package
```

- VS Code の拡張画面（Extensions）を開く
- 右上の **…（その他の操作）** → **「VSIX からインストール…」** を選び、生成された `.vsix` を選択してインストールする

#### コマンドから VSIX をインストールする（Cursor / VS Code）

VSIX のパスを指定して CLI からインストールできます。

```bash
# VS Code
code --install-extension ./rspec-explorer-0.0.1.vsix

# Cursor
cursor --install-extension ./rspec-explorer-0.0.1.vsix
```

## 🛠 技術スタック
- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **実行環境**: Node.js
- **パッケージ管理**: [pnpm](https://pnpm.io/)
- **ビルドツール**: tsc (TypeScript Compiler)
- **テスト用ツール**: RSpec (Ruby)

## 📁 ディレクトリ構成
```text
rspec-explorer/
├── .vscode/
│   └── launch.json          # デバッグ実行（F5）用の設定
├── src/                     # ソースコード（TypeScript）
│   ├── extension.ts         # エントリポイント（Controller初期化）
│   ├── rspecParser.ts       # describe/it を抽出するロジック
│   └── rspecRunner.ts       # RSpec コマンドの実行ロジック
├── sample/                  # 動作確認用のサンプルRSpecプロジェクト
├── out/                     # コンパイル後のJS（自動生成）
├── package.json             # 拡張機能の定義・スクリプト
├── pnpm-lock.yaml           # pnpm ロックファイル
├── tsconfig.json            # TypeScript 設定
└── node_modules/            # 依存パッケージ

## 📦 公開手順

pnpm run package
pnpm run publish

## ✅ サンプルテストの実行（動作確認）

このリポジトリには、拡張の動作確認用に `sample/` 配下へ最小の RSpec プロジェクトを同梱しています。

### ターミナルから実行

```bash
cd sample
bundle install
bundle exec rspec
```

### VS Code から実行

GUI手順は省略しています。上記のCUIコマンド（`dev:cursor` / `dev:vscode`）で Host を起動してください。

