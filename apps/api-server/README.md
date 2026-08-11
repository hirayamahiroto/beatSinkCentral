# api-server

beatSinkCentral の API サーバー。**Hono standalone**（Next.js には依存しない）で、Vercel Functions 上で動く。

設計は `docs/architecture/server/` を参照する。索引は `docs/README.md`。

## ローカル開発

```bash
npm run dev            # tsx watch src/server.ts（既定ポート 3001。PORT で変更可）
```

必要な環境変数は `.env.example` を参照。`AUTH0_SECRET` は beatfolio と同じ値にする（同一のセッション Cookie を復号するため）。

## コマンド

| コマンド         | 内容                                                     |
| ---------------- | -------------------------------------------------------- |
| `npm run dev`    | ローカル開発サーバー（Node + @hono/node-server）         |
| `npm run build`  | 型チェック（`tsc --noEmit`）。成果物は Vercel が生成する |
| `npm run lint`   | ESLint                                                   |
| `npm test`       | Vitest（Node 環境）                                      |
| `npm start`      | ローカルで本番相当に起動                                 |

## 構成

| パス          | 役割                                                          |
| ------------- | ------------------------------------------------------------- |
| `src/index.ts`  | Hono アプリ本体。`export default app` を Vercel が検出する    |
| `src/server.ts` | ローカル開発用の Node サーバー（Vercel では使わない）         |
| `src/routes/`   | エンドポイント定義（1 ユニット = 1 エンドポイント）           |
| `src/usecases/` | ユースケース                                                  |
| `src/domain/`   | ドメイン層（純粋。DB / フレームワークに依存しない）           |
| `src/infrastructure/` | DB・Auth0・リポジトリ実装                               |
| `src/middlewares/`    | Basic 認証・Auth0 セッション検証・リクエスト相関 ID     |

## デプロイ

Vercel の framework preset は `hono`。プロジェクト設定は `infrastructure/` の Terraform で管理する（`docs/architecture/infrastructure/README.md`）。
