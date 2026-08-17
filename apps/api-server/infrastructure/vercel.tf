# api-server の Vercel project 本体。
# 既存リソースは terraform import で引き取る:
#   terraform import vercel_project.api_server <project_id>
#
# framework / build_command / install_command は apps/api-server/vercel.json が上書きするため、
# 実効値は vercel.json 側。ここは import 済み project 設定の HCL 上の表現で、同値に保つ。
# 所有の分担: docs/architecture/infrastructure/README.md「設定の所有者」
resource "vercel_project" "api_server" {
  name      = var.project_name
  framework = "hono"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = "main"
  }

  root_directory = var.root_directory

  # Hono プリセットの buildCommand は null（Vercel が src/index.ts を自動ビルド）だが、
  # ワークスペースの database パッケージの dist を先に生成する必要があるため明示する
  # （実効値は apps/api-server/vercel.json 側。同値に保つ）
  build_command   = "cd ../.. && npx turbo run build --filter=api-server"
  install_command = "cd ../.. && npm install"
}
