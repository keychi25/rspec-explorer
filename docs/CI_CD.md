# CI/CD（GitHub Actions）運用ドキュメント

このリポジトリでは GitHub Actions を使って、PR/Push 時の品質チェック（CI）と、GitHub Releases + VS Code Marketplace / Open VSX 公開（CD）を自動化しています。

## 目的

- PR の段階で **型チェック / lint / テスト** を自動実行し、壊れた状態でのマージを防ぐ
- リリース作業を「`master` にマージする」だけに寄せ、**VSIX の生成・添付**と **Marketplace / Open VSX publish** を一括で行う
- リリースの前提条件（Changelog 更新、token 設定など）を CI で機械的に検証する

## 全体像

- **CI**: `master` への push / Pull Request で実行
  - `prepublish:check` → `check` → `lint` → `test`
- **Release Automation**: `master` への push で実行
  - 通常コミット: release PR を自動作成
  - release commit (`chore(release): ...`): tag 作成・GitHub Release・Marketplace publish を実行
- **CD（Release）**: `master` push で実行される `Release Automation` が担当
  - release PR の作成・CI・auto-merge
  - `prepublish:verify`（ビルド/テスト/VSIX 生成）
  - GitHub Release を作成して `.vsix` を添付
  - `vsce publish` で VS Code Marketplace に publish
  - `ovsx publish` で Open VSX に publish

## CI ワークフロー

定義: `.github/workflows/ci.yml`

### トリガー

- `push`（`master` ブランチ）
- `pull_request`

### 実行内容

CI は「公開前に最低限守りたい品質ゲート」を回します。

- `pnpm -s prepublish:check`
  - `package.json` / `README.md` などの必須要件を検証（軽量）
- `pnpm -s check`
  - TypeScript コンパイル（型チェック）
- `pnpm -s lint`
  - ESLint
- `pnpm -s test`
  - Vitest

## Marketplace のバージョン表記（重要）

VS Marketplace は `package.json` の `version` に **semver の prerelease サフィックス**（例: `0.0.5-rc1`）を受け付けません。

- **通常のバージョン**は `0.0.5` のように **プレフィックスなしの semver** にします
- Marketplace 上で「プレリリース」として出したい場合は、バージョン文字列ではなく **`vsce publish --pre-release`** を使います（公式: [Prerelease Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#prerelease-extensions)）

## リポジトリ変数 `MARKETPLACE_PRERELEASE`

GitHub の **Repository variables** に次を設定できます（任意）。

- Name: `MARKETPLACE_PRERELEASE`
- Value: `true`（プレリリースとして publish / GitHub Release も prerelease 扱い） / 未設定または `false`（安定版として publish）

ローカルで手動 publish する場合は、従来どおり `pnpm -s release:prod`（チェック + 検証 + publish）か、検証後に `pnpm -s release:publish:prerelease` を使います。

## GitHub Release と VSIX

Release ワークフローは `.vsix` を生成し、GitHub Release に添付します。

- 目的: Marketplace 以外（Cursor/VS Code への手動インストールなど）でも配布できるようにする

## Secrets（必須）

### `VSCE_PAT`

Marketplace publish のために必要な Personal Access Token です。

- GitHub: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`
  - Name: `VSCE_PAT`
  - Secret: 発行した PAT 文字列

PAT は Azure DevOps 側で発行します（作成時に一度だけ表示されます）。

このトークンは、Marketplace の publisher `keychi25` に対して publish 権限を持つアカウントで発行したものを使ってください。権限のない PAT を使うと、Release で `TF400813: ... is not authorized to access this resource.` となります。

参考: [Publishing Extensions（VS Code Extension API）](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

### `OVSX_PAT`

Cursor など Open VSX ベースの拡張機能検索で見つけられるようにするための token です。

- GitHub: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`
  - Name: `OVSX_PAT`
  - Secret: Open VSX で発行した PAT

初回は Open VSX 側で namespace を作成してから token を発行します。

参考:
- [Publishing Extensions（Open VSX Wiki）](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions)
- [Open VSX Registry](https://open-vsx.org/)

### Open VSX の初回セットアップ

1. `https://open-vsx.org/` でサインイン
2. publisher/namespace として `keychi25` を作成する
3. Open VSX の access token を発行する
4. GitHub Secret `OVSX_PAT` に登録する

ローカルから初回 publish を試す場合は、次のように実行できます。

```bash
OVSX_PAT=... pnpm -s release:publish:openvsx:package rspec-explorer-0.0.9.vsix
```

## リリース手順（推奨）

1. `master` に通常の変更を PR 経由でマージする
2. `Release Automation` が release PR を自動作成する
3. release PR の CI が通ると auto-merge される
4. 同じ workflow の中で tag / GitHub Release / VS Code Marketplace / Open VSX publish まで実行される

通常運用では、手動で tag を作る必要はありません。

例外的にローカルから tag を扱いたい場合だけ、次の npm script を使えます。

```bash
pnpm -s release:tag:dry-run
pnpm -s release:tag
pnpm -s release:tag:push
```

## Release Automation ワークフロー

定義: `.github/workflows/release-automation.yml`

### 動作

- `master` に通常の変更が入る
- patch version を 1 つ上げる release PR を自動作成する
- release PR は auto-merge 設定で自動マージされる
- release commit が `master` に入ると、同じ workflow の中で対応する `vX.Y.Z` タグを自動作成する
- 同じ workflow の中で GitHub Release 作成、VS Code Marketplace publish、Open VSX publish まで実行する
- JavaScript action の Node 24 移行警告に備えて `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` を有効にしている

### 前提

- `master` の branch protection は `Require a pull request` を有効にしたまま使える
- 自動 release PR を通すため、このリポジトリでは approval 必須件数を `0` にしている
- `Settings` -> `Actions` -> `General` で workflow permissions を `Read and write permissions` にしている
- `Allow GitHub Actions to create and approve pull requests` を有効にしている
- Marketplace publish 自体は引き続き `VSCE_PAT` に依存する
- Open VSX publish は `OVSX_PAT` が設定されているときだけ実行する
- `VSCE_PAT` は workflow 内で `vsce verify-pat <publisher>` により publish 権限を事前検証する

## よくある失敗と対処

- **`VSCE_PAT is not set`**
  - GitHub Secrets に `VSCE_PAT` が入っていない（または名前が違う）
- **`CHANGELOG.md does not include "## <version>"`**
  - `CHANGELOG.md` に該当バージョンのヘッダがない
- **tag と version が不一致**
  - `package.json` の `version` と `vX.Y.Z` を一致させる
- **Marketplace publish が失敗する**
  - PAT の scope が不足している / PAT が失効している / publisher が違う、など
  - 具体的に `TF400813` が出る場合は、`VSCE_PAT` が対象 publisher に対して publish 権限を持っていない可能性が高いです
  - まずは PAT を作り直し、`VSCE_PAT` を更新するのが早いことが多い
- **Cursor から検索しても出てこない**
  - VS Code Marketplace だけでなく Open VSX にも publish する
  - `OVSX_PAT` が未設定だと Open VSX publish はスキップされる
  - Open VSX 側の namespace 作成が未完了だと publish できない
- **`The VS Marketplace doesn't support prerelease versions: 'x.y.z-rc1'`**
  - `version` から `-rc1` などのサフィックスを外し、プレリリースは `vsce publish --pre-release`（CI では `MARKETPLACE_PRERELEASE=true`）で出す
