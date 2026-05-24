terraform {
  required_version = ">= 1.5.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 5.0"
    }
  }

  # 段階1: ローカル state で開始する。
  # 段階2: Terraform Cloud を採用したら以下のブロックを有効化する。
  # cloud {
  #   organization = "<your-tfc-org>"
  #   workspaces {
  #     name = "beatfolio-infrastructure"
  #   }
  # }
}
