# api-server の環境変数定義。値はすべて var から直接取得する。
# DATABASE_URL は Transaction pooler (6543) を使う前提。マイグレ用 (5432) は GHA Secrets 側で管理。
# 詳細: docs/server-architecture/database-connection.md

locals {
  production_env = {
    APP_BASE_URL              = var.production_app_base_url
    API_SERVER_BASE_URL       = var.production_api_server_base_url
    DATABASE_URL              = var.production_database_url
    AUTH0_DOMAIN              = var.production_auth0_domain
    AUTH0_CLIENT_ID           = var.production_auth0_client_id
    AUTH0_CLIENT_SECRET       = var.production_auth0_client_secret
    AUTH0_SECRET              = var.production_auth0_secret
    SUPABASE_URL              = var.production_supabase_url
    SUPABASE_SERVICE_ROLE_KEY = var.production_supabase_service_role_key
  }

  preview_env = {
    API_SERVER_BASE_URL       = var.preview_api_server_base_url
    DATABASE_URL              = var.preview_database_url
    AUTH0_DOMAIN              = var.preview_auth0_domain
    AUTH0_CLIENT_ID           = var.preview_auth0_client_id
    AUTH0_CLIENT_SECRET       = var.preview_auth0_client_secret
    AUTH0_SECRET              = var.preview_auth0_secret
    SUPABASE_URL              = var.preview_supabase_url
    SUPABASE_SERVICE_ROLE_KEY = var.preview_supabase_service_role_key
  }

  sensitive_keys = toset([
    "DATABASE_URL",
    "AUTH0_CLIENT_SECRET",
    "AUTH0_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
  ])
}

resource "vercel_project_environment_variable" "production" {
  for_each   = local.production_env
  project_id = vercel_project.api_server.id
  key        = each.key
  value      = each.value
  target     = ["production"]
  sensitive  = contains(local.sensitive_keys, each.key)
}

resource "vercel_project_environment_variable" "preview" {
  for_each   = local.preview_env
  project_id = vercel_project.api_server.id
  key        = each.key
  value      = each.value
  target     = ["preview"]
  sensitive  = contains(local.sensitive_keys, each.key)
}
