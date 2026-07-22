# api-server infrastructure (Terraform)

api-server の Vercel project と環境変数を Terraform で管理する。

このプロジェクトは **自己完結型** で、他の Terraform プロジェクト(shared 等)に依存しない。
必要な値はすべて自分の `terraform.tfvars` から読み込む。

全体方針は [`docs/architecture/infrastructure/README.md`](../../../docs/architecture/infrastructure/README.md) を参照。

## api-server 固有の注意

### DATABASE_URL は Transaction pooler (6543) を使う

`production_database_url` / `preview_database_url` に Transaction pooler の URL を設定する。
マイグレーション用 (5432) は **GitHub Actions Secrets 側で別管理**(本リポジトリの管理対象外、Phase 2 で統合予定)。

詳細は [`docs/architecture/server/database-connection.md`](../../../docs/architecture/server/database-connection.md) を参照。

### AUTH0_SECRET は beatfolio と同値を入れる

セッション Cookie 暗号化キーのため、beatfolio と api-server で **同じ値** を入れる必要がある。
本プロジェクトでは自己完結方針のため、beatfolio 側の `terraform.tfvars` にも同じ `auth0_secret` を手動で入れること。

## 初回セットアップ(既存リソースの import)

### 1. 入力値の準備

```bash
cd apps/api-server/infrastructure
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars に実値を埋める(.gitignore 済、コミット禁止)
```

### 2. 初期化

```bash
export VERCEL_API_TOKEN=<your-token>
terraform init
```

### 3. project 本体を import

Project ID は GitHub Secret `VERCEL_API_SERVER_PROJECT_ID` の値。

```bash
terraform import vercel_project.api_server <project_id>
```

### 4. 環境変数を import

```bash
# 全 env を一覧表示
curl -s "https://api.vercel.com/v9/projects/<project_id>/env?teamId=<team_id>" \
  -H "Authorization: Bearer $VERCEL_API_TOKEN" | jq

# 個別 import 例(production スコープの DATABASE_URL)
terraform import \
  'vercel_project_environment_variable.production["DATABASE_URL"]' \
  '<project_id>/<env_id>'

# preview スコープ
terraform import \
  'vercel_project_environment_variable.preview["DATABASE_URL"]' \
  '<project_id>/<env_id>'

# production / preview 共通スコープ(BASIC_AUTH 等)
terraform import \
  'vercel_project_environment_variable.shared["BASIC_AUTH_USERNAME"]' \
  '<project_id>/<env_id>'
```

各 env を 1 つずつ繰り返す。

### 5. 差分なしを確認

```bash
terraform plan
```

`No changes` が出れば import 成功。

## 通常運用

値の更新フロー:

1. `terraform.tfvars` を編集
2. `terraform plan` で差分を確認
3. `terraform apply`

Vercel Dashboard での手動変更は禁止(差分が出たら Terraform を正とする)。

## ファイル構成

| ファイル                    | 役割                                                          |
| --------------------------- | ------------------------------------------------------------- |
| `main.tf`                   | terraform ブロック、バックエンド設定                          |
| `providers.tf`              | Vercel provider 設定(team_id は var から取得)                 |
| `variables.tf`              | 入力変数(Auth0 / DB / Base URL / Basic Auth / Vercel team 等) |
| `vercel.tf`                 | `vercel_project` リソース                                     |
| `env.tf`                    | 環境変数群(production / preview / 全環境共通)                 |
| `terraform.tfvars.example`  | 入力変数のサンプル                                            |
| `.gitignore`                | Terraform 生成物の除外                                        |

