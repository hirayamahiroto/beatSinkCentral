# beatfolio の環境変数定義。値はすべて var から直接取得する。
# beatfolio は DATABASE_URL を持たない(api-server 経由でアクセスするため)。

locals {
  production_env = {
    APP_BASE_URL        = var.production_app_base_url
    API_SERVER_BASE_URL = var.production_api_server_base_url
    AUTH0_DOMAIN        = var.production_auth0_domain
    AUTH0_CLIENT_ID     = var.production_auth0_client_id
    AUTH0_CLIENT_SECRET = var.production_auth0_client_secret
    AUTH0_SECRET        = var.production_auth0_secret
  }

  preview_env = {
    API_SERVER_BASE_URL = var.preview_api_server_base_url
    AUTH0_DOMAIN        = var.preview_auth0_domain
    AUTH0_CLIENT_ID     = var.preview_auth0_client_id
    AUTH0_CLIENT_SECRET = var.preview_auth0_client_secret
    AUTH0_SECRET        = var.preview_auth0_secret
  }

  # production / preview の両方に同値を配る env(機密値あり)。
  # Vercel の制約により、sensitive = true の env は target に "development" を含められないため、
  # ローカル開発(vercel dev)での参照は .env.local で別途設定する。
  shared_env = {
    ENABLE_BASIC_AUTH   = var.enable_basic_auth
    BASIC_AUTH_USERNAME = var.basic_auth_username
    BASIC_AUTH_PASSWORD = var.basic_auth_password
  }

  sensitive_keys = toset([
    "AUTH0_CLIENT_SECRET",
    "AUTH0_SECRET",
    "BASIC_AUTH_USERNAME",
    "BASIC_AUTH_PASSWORD",
  ])
}

resource "vercel_project_environment_variable" "production" {
  for_each   = local.production_env
  project_id = vercel_project.beatfolio.id
  key        = each.key
  value      = each.value
  target     = ["production"]
  sensitive  = contains(local.sensitive_keys, each.key)
}

resource "vercel_project_environment_variable" "preview" {
  for_each   = local.preview_env
  project_id = vercel_project.beatfolio.id
  key        = each.key
  value      = each.value
  target     = ["preview"]
  sensitive  = contains(local.sensitive_keys, each.key)
}

resource "vercel_project_environment_variable" "shared" {
  for_each   = local.shared_env
  project_id = vercel_project.beatfolio.id
  key        = each.key
  value      = each.value
  target     = ["production", "preview"]
  sensitive  = contains(local.sensitive_keys, each.key)
}
