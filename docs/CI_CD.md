# CI/CD（GitHub Actions）運用ドキュメント

このリポジトリでは GitHub Actions を使って、PR/Push 時の品質チェック（CI）と、タグ push を起点にした GitHub Releases + VS Code Marketplace 公開（CD）を自動化しています。

## 目的

- PR の段階で **型チェック / lint / テスト** を自動実行し、壊れた状態でのマージを防ぐ
- リリース作業を「タグを打つ」だけに寄せ、**VSIX の生成・添付**と **Marketplace publish** を一括で行う
- リリースの前提条件（Changelog 更新、token 設定など）を CI で機械的に検証する

## 全体像

- **CI**: `master` への push / Pull Request で実行
  - `prepublish:check` → `check` → `lint` → `test`
- **Release Automation**: `master` への push で実行
  - 通常コミット: release PR を自動作成
  - release commit (`chore(release): ...`): tag を自動作成
- **CD（Release）**: `v*` タグの push で実行
  - タグと `package.json` の version が一致することを検証（例: `v0.0.4`）
  - `release-prod-check.mjs` で「リリース可能な状態」を検証（PAT 必須など）
  - `prepublish:verify`（ビルド/テスト/VSIX 生成）
  - GitHub Release を作成して `.vsix` を添付
  - `vsce publish`（またはプレリリース時は `vsce publish --pre-release`）で Marketplace に publish

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

## Release（CD）ワークフロー

定義: `.github/workflows/release.yml`

### トリガー

- `push`（タグが `v*` にマッチしたとき）
  - 例: `v0.0.4`

### 重要な前提（タグと version の一致）

Release では、タグ名と `package.json` の `version` が一致しない場合は失敗します。

- OK: `package.json: "0.0.4"` かつ tag: `v0.0.4`
- NG: `package.json: "0.0.4"` かつ tag: `v0.0.5`

このチェックにより「間違ったバージョンを Marketplace に出してしまう」事故を予防します。

### 実行内容

1. 依存関係をインストール（`pnpm install --frozen-lockfile`）
2. タグと version の整合性チェック
3. `scripts/release-prod-check.mjs` を実行
   - **VSCE_PAT が設定されていること**
   - `CHANGELOG.md` に `## <version>` があること
   - `publisher` が `local` ではないこと（※該当のチェックが有効な場合）
   - `package.json` に Marketplace 向けの公開メタデータが入っていること（repository など）
   - ※ローカル運用向けの「git working tree が clean」チェックは Actions でも概ね満たされます
4. `pnpm -s prepublish:verify`（ビルド/テスト/VSIX 生成）
5. `.vsix` を検出し、GitHub Release を作成して添付
6. Marketplace に publish（このリポジトリでは事前に `prepublish:verify` 済みのため、`vsce publish` のみ実行）
   - 安定版: `pnpm -s release:publish`（`vsce publish`）
   - Marketplace のプレリリース版: `pnpm -s release:publish:prerelease`（`vsce publish --pre-release`）
   - CI ではリポジトリ変数 `MARKETPLACE_PRERELEASE` が `true` のとき `--pre-release` を付けます（下記）

### Marketplace のバージョン表記（重要）

VS Marketplace は `package.json` の `version` に **semver の prerelease サフィックス**（例: `0.0.5-rc1`）を受け付けません。

- **通常のバージョン**は `0.0.5` のように **プレフィックスなしの semver** にします
- Marketplace 上で「プレリリース」として出したい場合は、バージョン文字列ではなく **`vsce publish --pre-release`** を使います（公式: [Prerelease Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#prerelease-extensions)）

### リポジトリ変数 `MARKETPLACE_PRERELEASE`

GitHub の **Repository variables** に次を設定できます（任意）。

- Name: `MARKETPLACE_PRERELEASE`
- Value: `true`（プレリリースとして publish / GitHub Release も prerelease 扱い） / 未設定または `false`（安定版として publish）

ローカルで手動 publish する場合は、従来どおり `pnpm -s release:prod`（チェック + 検証 + publish）か、検証後に `pnpm -s release:publish:prerelease` を使います。

### GitHub Release と VSIX

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

## リリース手順（推奨）

1. `package.json` の `version` を更新
2. `CHANGELOG.md` に `## <version>` セクションを追加
3. ローカルで `pnpm -s prepublish:verify` が通ることを確認（任意だが推奨）
4. コミットして push
5. タグを作成して push

```bash
# 例: version=0.0.5 のリリース（タグは v + package.json の version）
git tag v0.0.5
git push origin v0.0.5
```

ローカルから安全に実行したい場合は、次の npm script も使えます。

```bash
# 何を作るかだけ確認
pnpm -s release:tag:dry-run

# ローカルにタグだけ作成
pnpm -s release:tag

# タグ作成と push をまとめて実行
pnpm -s release:tag:push
```

これで GitHub Actions の `Release` が走り、GitHub Release 作成 + VSIX 添付 + Marketplace publish まで自動で行われます。

## Release Automation ワークフロー

定義: `.github/workflows/release-automation.yml`

### 動作

- `master` に通常の変更が入る
- patch version を 1 つ上げる release PR を自動作成する
- release PR は auto-merge 設定で自動マージされる
- release commit が `master` に入ると、対応する `vX.Y.Z` タグを自動作成する
- そのタグ push をきっかけに既存の `Release` workflow が動く

### 前提

- `master` の branch protection は `Require a pull request` を有効にしたまま使える
- 自動 release PR を通すため、このリポジトリでは approval 必須件数を `0` にしている
- Marketplace publish 自体は引き続き `VSCE_PAT` に依存する

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
- **`The VS Marketplace doesn't support prerelease versions: 'x.y.z-rc1'`**
  - `version` から `-rc1` などのサフィックスを外し、プレリリースは `vsce publish --pre-release`（CI では `MARKETPLACE_PRERELEASE=true`）で出す
