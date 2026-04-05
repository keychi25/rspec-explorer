# 公開前チェックリスト（拡張機能）

このリポジトリは VS Code/Cursor 拡張として公開する前提です。

## 1. 自動チェック（必須）

```bash
pnpm -s prepublish:verify
```

上記は次を順番に実行します。

- `pnpm -s prepublish:check`
- `pnpm -s check`
- `pnpm -s lint`
- `pnpm -s test`
- `pnpm -s package`

## 2. 手動チェック（提出前）

- `package.json` の `publisher` が実際の Marketplace publisher id になっていること（`local` のままにしない）
- `README.md` にセットアップ、使い方、公開手順があること
- 生成された `.vsix` を Cursor と VS Code の両方でインストールし、基本フローが動くこと
- `sample/` で `bundle exec rspec` が実行できること
- Open VSX に公開する場合は `OVSX_PAT` と namespace が準備できていること

## 3. リリース当日の最終確認

- `version` を更新済み
- `CHANGELOG.md` を更新済み
- 直近の `pnpm -s prepublish:verify` が成功
- 生成物（`.vsix`）が想定どおり

## 4. 本番公開コマンド

`VSCE_PAT` をセットして実行します。Open VSX へも手動 publish したい場合は `OVSX_PAT` も用意します。

```bash
VSCE_PAT=xxxxx pnpm -s release:prod
```

`release:prod` は以下を満たさないと失敗します。

- `publisher !== "local"`
- `VSCE_PAT` が設定済み
- `CHANGELOG.md` に `## <version>` がある
- git working tree が clean

Open VSX 向けの手動 publish は次で実行できます。

```bash
OVSX_PAT=xxxxx pnpm -s release:publish:openvsx:package rspec-explorer-<version>.vsix
```
