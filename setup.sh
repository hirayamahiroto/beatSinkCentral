#!/bin/bash

# エラーが発生したら停止する
set -e

echo "✅ ローカルの環境セットアップを開始します..."

# 現在のディレクトリを記録
CURRENT_DIR=$(pwd)
# プロジェクトのルートディレクトリを相対パスで設定
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}" && pwd)"

# 1. ローカルのSupabaseを起動
echo "✅ 1. ローカルのSupabaseを起動しています..."
cd "${ROOT_DIR}/packages/database/supabase"
supabase start
supabase status

# 2. 必要なパッケージをインストール
echo "✅ 2. 依存パッケージを確認しています..."
cd "${ROOT_DIR}"
npm install

# 3. データベースのマイグレーションを実行
echo "✅ 3. データベースのマイグレーションを実行しています..."
cd "${ROOT_DIR}/packages/database"
# 環境変数を設定
export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
echo "DATABASE_URL: $DATABASE_URL"
# マイグレーションを適用
echo "✅ マイグレーションを適用中..."
npm run db:migrate

# 4. シードデータを投入
echo "✅ 4. シードデータを投入しています..."
npm run db:seed

# 5. アプリケーションを起動
echo "✅ 5. アプリケーションを起動しています..."
cd "${ROOT_DIR}"
npm run dev

# 元のディレクトリに戻る
cd "${CURRENT_DIR}"

echo "✅ セットアップが完了しました！" 

