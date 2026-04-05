# RSpec Explorer for VS Code

RSpec のテストを VS Code のテストエクスプローラーおよびエディタのガター（行番号の横）から直接実行できる拡張機能です。

## 機能

- **Test Explorer から RSpec を実行**
- **エディタのガター（行番号の横）から RSpec を実行**

## 動作要件

- **Ruby / Bundler**（`bundle exec rspec` で実行できること）
- **RSpec**（プロジェクトに導入されていること）

## 使い方

1. 対象プロジェクトで依存をインストールします。

```bash
bundle install
```

2. VS Code（または Cursor）でプロジェクトを開きます。
3. Test Explorer、またはエディタのガターからテストを実行します。

## トラブルシュート

- **テストが見つからない / 実行できない**
  - `bundle exec rspec` がプロジェクト直下で実行できるか確認してください
  - Ruby / Bundler / RSpec が正しくインストールされているか確認してください

## サポート

- バグ報告: GitHub の `Bug report` から報告してください
- 機能要望: GitHub の `Feature request` から提案してください
- 使い方の質問: GitHub Discussions を利用してください
- コントリビュート方法: `CONTRIBUTING.md` を参照してください
