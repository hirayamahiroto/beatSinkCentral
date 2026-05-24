# Vercel provider 設定。
# 認証は VERCEL_API_TOKEN 環境変数経由で行う。
provider "vercel" {
  team = var.vercel_team_id
}
