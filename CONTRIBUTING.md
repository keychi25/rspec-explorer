# コントリビューションガイド

RSpec Explorer へのコントリビュートありがとうございます。

## 開発セットアップ

```bash
pnpm install
pnpm -s check
pnpm -s test
```

必要に応じて、サンプルプロジェクトでも確認できます。

```bash
pnpm -s sample:setup
pnpm -s sample:test
```

## Pull Request

- `master` 向けに Pull Request を作成してください
- 変更はできるだけ小さく、レビューしやすい単位にしてください
- 挙動が変わる場合は、テストの追加または更新をお願いします
- 利用者向けの変更がある場合は `CHANGELOG.md` も更新してください

PR を作る前に、以下を実行してください。

```bash
pnpm -s check
pnpm -s lint
pnpm -s test
pnpm -s package
```

## Issue

- 再現できる不具合は `バグ報告` を使ってください
- 改善提案は `機能要望` を使ってください
- 使い方の質問は GitHub Discussions を使ってください
