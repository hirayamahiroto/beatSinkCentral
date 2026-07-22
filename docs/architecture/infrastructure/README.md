# インフラ管理(Terraform / IaC)

Vercel project と env を Terraform で管理する。Dashboard 操作は禁止、変更はすべて HCL の編集 + `terraform apply` 経由で行う。

## ディレクトリ構成

app ごとに **自己完結型**。shared 層は持たない(app 間の依存を作らない)。

```
beatSinkCentral/
└── apps/
    ├── beatfolio/infrastructure/
    │   ├── main.tf / providers.tf / variables.tf / vercel.tf / env.tf
    │   ├── terraform.tfvars(.gitignore 対象、コミット禁止)
    │   └── terraform.tfvars.example
    └── api-server/infrastructure/
        └── (同形)
```

両 app で同値が必要な env(`AUTH0_SECRET` 等)は、両方の tfvars に手動で同値を入れる運用で担保する。

## 各ファイルの責務

| ファイル                    | 内容                                                    |
| --------------------------- | ------------------------------------------------------- |
| `main.tf`                   | `terraform` ブロック・バックエンド設定                  |
| `providers.tf`              | vercel provider 宣言                                    |
| `variables.tf`              | 入力変数(Auth0 / DB / Base URL / Basic Auth / team 等) |
| `vercel.tf`                 | `vercel_project` リソース                               |
| `env.tf`                    | env 群(production / preview / 共通)                    |
| `terraform.tfvars.example`  | 入力変数のサンプル                                      |

## 運用ルール

- env 変更は **HCL 編集 → tfvars 更新 → `terraform apply`** のフローで行う
- Vercel Dashboard での手動編集は禁止(次の apply で上書きされる)
- 両 app で同値が必要な値は両方の tfvars を同時更新
- PR では `terraform plan` をレビュー対象にする(Phase 5 で自動化予定)

## 移行ロードマップ

### Step 1: HCL 一式の整備

- [x] `apps/api-server/infrastructure/` 一式を整備
- [x] env.tf を Vercel 制約に合わせて `shared`(production + preview)構成に修正
- [ ] `apps/beatfolio/infrastructure/` に同様に整備(現在 stash 退避中)

### Step 2: 既存リソースの import(api-server)

- [x] `terraform.tfvars` に実値を投入
- [x] `terraform init`
- [x] `terraform plan` でエラーなく差分計算できることを確認
- [ ] `vercel_project.api_server` を import
- [ ] 既存 env vars を 1 つずつ import
- [ ] `terraform plan` で差分なしを確認
- [ ] `terraform apply`

### Step 3: 既存リソースの import(beatfolio)

- [ ] stash を pop し、api-server と同じ自己完結型に再構成
- [ ] Step 2 と同じ流れを実行

### Step 4: Terraform Cloud 移行

- [ ] TFC アカウント / Organization / Workspaces を作成
- [ ] `main.tf` の `cloud {}` ブロックを有効化
- [ ] state を TFC に移行
- [ ] `terraform.tfvars` の内容を TFC variables に移行

### Step 5: CI 連携(詳細は次節)

- [ ] PR で自動 `terraform plan`、main merge で自動 `apply`
- [ ] 既存の GitHub Actions から手動 env 操作(`vercel env rm DEBUG_URL` 等)を撤去

---

## CI/CD への組み込み計画

現在の GitHub Actions(`.github/workflows/deploy-*.yml`)は **コードの deploy** を担当。Terraform を CI に統合して **インフラ設定の自動適用** も同じパイプラインで完結させる。

### 目指す形

```
PR 作成(*.tf 変更)
    ↓
GH Actions: terraform plan  → PR コメントに差分投稿
    ↓
レビュー → main マージ
    ↓
GH Actions: terraform apply → Vercel に反映
    ↓
db-migrate → vercel deploy(既存)
```

### ジョブ構成

| ジョブ            | トリガー                | 役割                         | 必要 secret                          |
| ----------------- | ----------------------- | ---------------------------- | ------------------------------------ |
| `terraform-plan`  | PR(infra/* 変更時)      | 差分計算 → PR コメント投稿   | `VERCEL_TOKEN` + `TF_VAR_xxx` 群     |
| `terraform-apply` | main push               | リソース反映                 | `VERCEL_TOKEN` + `TF_VAR_xxx` 群     |
| `db-migrate`      | main / preview push     | (既存) DB マイグレーション   | `DATABASE_URL`(5432)                 |
| `deploy`          | apply 後                | (既存) `vercel deploy`        | `VERCEL_TOKEN` + project ID 系       |

順序は **apply → deploy**。env 更新後の build にする必要があるため。

### 実値の渡し方

CI では tfvars を使わず、GH Secrets を `TF_VAR_<変数名>` 環境変数経由で渡す。

```yaml
- run: terraform apply -auto-approve
  working-directory: apps/api-server/infrastructure
  env:
    VERCEL_API_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    TF_VAR_production_auth0_secret: ${{ secrets.PRODUCTION_AUTH0_SECRET }}
    TF_VAR_production_database_url: ${{ secrets.PRODUCTION_DATABASE_URL_RUNTIME }}
    # ... 全変数を同様に
```

### State の前提

ローカル state では CI から apply できない(ランナーは毎回まっさら)。**Phase 4 で TFC 移行を済ませてから** CI 連携(Phase 5)に進む。

### 既存 deploy workflow からの撤去対象

| 撤去対象                                      | 理由                                                    |
| --------------------------------------------- | ------------------------------------------------------- |
| `vercel env rm DEBUG_URL` 等の手動 env 操作    | Terraform が SoT になるので HCL 変更で行う              |
| `vercel pull` / `vercel build` / `vercel deploy` | そのまま残す(Terraform は設定管理、deploy 実行は別)   |

### 段階適用

```
Phase 4: TFC 移行
   ↓
Phase 5-a: PR で plan を実行する workflow を追加(まだ手動 apply)
   ↓
Phase 5-b: main push で apply 自動化
   ↓
Phase 5-c: deploy-*.yml から手動 env 操作を撤去
```

いきなり全部 CI 化せず plan だけから始める。

---

## 未確定事項

- TFC 移行のタイミング
- `terraform plan` を PR コメント投稿する仕組みの選定(`hashicorp/setup-terraform` + custom action か Atlantis か)
- AUTH0_SECRET 等の重複値が増えた場合の管理方法(SOPS / 1Password CLI 連携など)

## 関連ドキュメント

- [データベース接続パターン](../server/database-connection.md) — Supabase pooler の使い分け
- [外部クライアントの実装パターン](../server/external-clients.md) — 環境変数を扱うクライアントの遅延初期化
