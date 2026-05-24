# beatfolio Terraform プロジェクトの入力変数。
# 本プロジェクトは自己完結型で、他の Terraform プロジェクトには依存しない。
# AUTH0_SECRET 等、api-server 側と同値が必要な値は両方の tfvars に同値を入れる運用とする。

# ===========================
# プロジェクト設定
# ===========================

variable "project_name" {
  description = "Vercel 上のプロジェクト名(Dashboard の Project 名と一致させる)。"
  type        = string
  default     = "beatfolio"
}

variable "root_directory" {
  description = "monorepo のうち beatfolio のルートパス。"
  type        = string
  default     = "apps/beatfolio"
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
    `openssl rand -hex 32` で生成。api-server 側と同じ値にする必要がある。
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
  description = "Preview の AUTH0_SECRET。api-server 側と同じ値にする必要がある。"
  type        = string
  sensitive   = true
}

# ===========================
# Base URLs
# ===========================

variable "production_app_base_url" {
  description = "Production の APP_BASE_URL(beatfolio 自身の公開 URL)。"
  type        = string
}

variable "production_api_server_base_url" {
  description = "Production の API_SERVER_BASE_URL(api-server の公開 URL)。"
  type        = string
}

variable "preview_app_base_url" {
  description = "Preview の APP_BASE_URL。"
  type        = string
}

variable "preview_api_server_base_url" {
  description = "Preview の API_SERVER_BASE_URL。"
  type        = string
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
