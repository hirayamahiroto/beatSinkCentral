# beatfolio の Vercel project 本体。
# 既存リソースは terraform import で引き取る:
#   terraform import vercel_project.beatfolio <project_id>
resource "vercel_project" "beatfolio" {
  name      = var.project_name
  framework = "nextjs"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = "main"
  }

  root_directory = var.root_directory

  build_command   = "cd ../.. && npx turbo run build --filter=beatfolio"
  install_command = "cd ../.. && npm install"
}
