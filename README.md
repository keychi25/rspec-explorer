# RSpec Explorer

RSpec Explorer は、Ruby プロジェクトの RSpec を **VS Code / Cursor の Test Explorer とエディタガターから実行できる拡張機能**です。

この README は、利用者向けに一般的な拡張機能 README の構成でまとめています。

## 主な特徴

- Test Explorer からテストを実行
- エディタのガター（行番号横）からテストを実行
- RSpec の実行結果を VS Code のテスト UI に反映

## 対応環境

- VS Code `1.80.0` 以上（`engines.vscode`）
- Ruby / Bundler が利用可能
- 対象プロジェクトに RSpec が導入済み

## インストール

1. VS Code Marketplace（または Open VSX）から **RSpec Explorer** をインストール
2. RSpec を使う Ruby プロジェクトを開く
3. 依存が未導入の場合はプロジェクトルートで以下を実行

```bash
bundle install
```

## 使い方

1. コマンドパレットまたはサイドバーから **Testing** ビューを開く
2. Test Explorer の各テスト、またはエディタガターの実行アイコンから RSpec を実行
3. 結果を Testing ビューで確認

## 前提条件と実行コマンド

この拡張機能は、対象プロジェクトで以下が通る状態を前提にしています。

```bash
bundle exec rspec
```

## トラブルシュート

### テストが表示されない / 実行できない

- プロジェクトルートで `bundle exec rspec` が成功するか確認
- Ruby / Bundler / RSpec のインストール状態を確認
- ワークスペースとして開いているフォルダが RSpec プロジェクトのルートか確認

### 実行結果が不安定な場合

- 依存関係を再インストール（`bundle install`）
- 拡張機能ホストを再起動
- VS Code（または Cursor）を再起動

## 開発者向け

- 開発手順: `docs/DEVELOPMENT.md`
- CI/CD: `docs/CI_CD.md`
- リリース前チェック: `docs/prepublish-checklist.md`
- コントリビュート: `CONTRIBUTING.md`

## サポート

- バグ報告: GitHub Issues（Bug report）
- 機能要望: GitHub Issues（Feature request）
- 質問・相談: GitHub Discussions

## ライセンス

MIT（`LICENSE`）
