# api-server Terraform プロジェクトの入力変数。
# 本プロジェクトは自己完結型で、shared 層 (terraform_remote_state) には依存しない。
# beatfolio と同じ値（AUTH0_SECRET 等）が必要な場合は両側の tfvars に手動で同値を入れる。

# ===========================
# プロジェクト設定
# ===========================

variable "project_name" {
  description = "Vercel 上のプロジェクト名(Dashboard の Project 名と一致させる)。"
  type        = string
  default     = "beat-sink-central-api"
}

variable "root_directory" {
  description = "monorepo のうち api-server のルートパス。"
  type        = string
  default     = "apps/api-server"
}

# ===========================
# プラットフォーム
# ===========================

variable "vercel_team_id" {
  description = "Vercel Team ID。"
  type        = string
}

variable "github_repo" {
  description = "リンク済み GitHub リポジトリ。owner/repo 形式。"
  type        = string
  default     = "hirayamahiroto/beatSinkCentral"
}

# ===========================
# Auth0
# ===========================

variable "production_auth0_domain" {
  description = "Production の AUTH0_DOMAIN。"
  type        = string
}

variable "production_auth0_client_id" {
  description = "Production の AUTH0_CLIENT_ID。"
  type        = string
}

variable "production_auth0_client_secret" {
  description = "Production の AUTH0_CLIENT_SECRET。"
  type        = string
  sensitive   = true
}

variable "production_auth0_secret" {
  description = <<-EOT
    Production の AUTH0_SECRET(セッション Cookie 暗号化キー)。
    `openssl rand -hex 32` で生成。beatfolio 側と同じ値にする必要がある。
  EOT
  type        = string
  sensitive   = true
}

variable "preview_auth0_domain" {
  description = "Preview の AUTH0_DOMAIN。"
  type        = string
}

variable "preview_auth0_client_id" {
  description = "Preview の AUTH0_CLIENT_ID。"
  type        = string
}

variable "preview_auth0_client_secret" {
  description = "Preview の AUTH0_CLIENT_SECRET。"
  type        = string
  sensitive   = true
}

variable "preview_auth0_secret" {
  description = "Preview の AUTH0_SECRET。beatfolio 側と同じ値にする必要がある。"
  type        = string
  sensitive   = true
}

# ===========================
# Base URLs
# ===========================

variable "production_app_base_url" {
  description = "Production の APP_BASE_URL(フロントエンド beatfolio の公開 URL)。"
  type        = string
}

variable "production_api_server_base_url" {
  description = "Production の API_SERVER_BASE_URL(api-server 自身の公開 URL)。"
  type        = string
}

variable "preview_api_server_base_url" {
  description = "Preview の API_SERVER_BASE_URL。"
  type        = string
}

# ===========================
# DATABASE_URL (Supabase Transaction pooler / port 6543)
# マイグレ用 (5432) は GHA Secrets 側で別管理（本プロジェクトの管理対象外）
# 詳細: docs/server-architecture/database-connection.md
# ===========================

variable "production_database_url" {
  description = <<-EOT
    Production の DATABASE_URL。
    Vercel ランタイム用 = Supabase Transaction pooler (6543)。
  EOT
  type        = string
  sensitive   = true
}

variable "preview_database_url" {
  description = "Preview の DATABASE_URL。Transaction pooler (6543)。"
  type        = string
  sensitive   = true
}

# ===========================
# Supabase Storage (プロフィール画像アップロード)
# service role key は api-server のみが保持する（beatfolio には配らない）
# ===========================

variable "production_supabase_url" {
  description = "Production の SUPABASE_URL(Supabase プロジェクトの API URL)。"
  type        = string
}

variable "production_supabase_service_role_key" {
  description = "Production の SUPABASE_SERVICE_ROLE_KEY。Storage への書き込みに使用。"
  type        = string
  sensitive   = true
}

variable "preview_supabase_url" {
  description = "Preview の SUPABASE_URL。"
  type        = string
}

variable "preview_supabase_service_role_key" {
  description = "Preview の SUPABASE_SERVICE_ROLE_KEY。"
  type        = string
  sensitive   = true
}

# ===========================
# Basic Auth (全環境共通)
# ===========================

variable "enable_basic_auth" {
  description = "Basic Auth を有効化するか(\"true\" / \"false\" 文字列)。"
  type        = string
  default     = "true"
}

variable "basic_auth_username" {
  description = "Basic Auth ユーザー名。"
  type        = string
  sensitive   = true
}

variable "basic_auth_password" {
  description = "Basic Auth パスワード。"
  type        = string
  sensitive   = true
}
