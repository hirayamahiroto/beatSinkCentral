# api-server の Vercel project 本体。
# 既存リソースは terraform import で引き取る:
#   terraform import vercel_project.api_server <project_id>
resource "vercel_project" "api_server" {
  name      = var.project_name
  framework = "nextjs"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = "main"
  }

  root_directory = var.root_directory

  build_command   = "cd ../.. && npx turbo run build --filter=api-server"
  install_command = "cd ../.. && npm install"
}
