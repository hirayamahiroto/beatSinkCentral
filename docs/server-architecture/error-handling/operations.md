# 運用への接続: ログ基盤・監視・SLO

このドキュメントは、[implementation.md](./implementation.md) で構築したエラーハンドリング基盤を **ログ基盤・監視・SLO/SRE 運用** に繋ぐためのロードマップを示す。

現状は「クライアントに返すエラーレスポンス」の設計が完了した段階。次に必要なのは **内部ログ基盤の整備と監視サービス（Datadog 等）との連携** であり、これを後づけしやすい構造になっているかを整理する。

---

## 現状の拡張性評価

現状のエラーは全て `resolveErrorResponse` を通過するため、**ログ出力点が1箇所に集中している**。これが拡張の最大のメリット。

| 観点                                        | 現状                                    | 監視基盤への適合度   |
| ------------------------------------------- | --------------------------------------- | -------------------- |
| ログ出力点の集約                            | ✅ `resolveErrorResponse` の 2 箇所     | ◎                    |
| 構造化フォーマット                          | ✅ JSON オブジェクト                    | ◎                    |
| エラー種別の識別可能性                      | ✅ `type` フィールド                    | ◎                    |
| ドメインコンテキスト（accountId 等）の保持  | ✅ `extras` で型付き保持                | ◎                    |
| 重要度分岐                                  | △ `console.warn` / `console.error` のみ | ○（要強化）          |
| リクエスト相関（trace_id, request_id）      | ❌ 未実装                               | ✗（要追加）          |
| サービスメタデータ（env, service, version） | ❌ 未実装                               | ✗（要追加）          |
| センシティブ情報のマスク                    | ❌ 未実装                               | △                    |
| ログ出力先の差し替え                        | ❌ `console.*` 直書き                   | ✗（要 interface 化） |

「基礎は良い、足りないのは周辺装備」という評価。周辺装備は本体の構造を変えずに追加できる。

---

## レベル1: Logger interface を挟む（最小侵襲）

`console.warn` / `console.error` を Logger interface 経由に置き換え、実装を環境で差し替えられるようにする。

```typescript
// utils/logger/index.ts（将来追加）
export interface Logger {
  warn(event: string, fields: Record<string, unknown>): void;
  error(event: string, fields: Record<string, unknown>): void;
}
```

- 開発環境: console ベース
- 本番環境: pino / winston / Datadog SDK などへ差し替え

変更箇所は `resolveErrorResponse` 内の 2 行だけ。

---

## レベル2: errorMap にログ制御を追加する（必要になったら）

per-error で log level や追加フィールドを宣言できるよう errorMap を拡張:

```typescript
AccountIdAlreadyTakenError: {
  status: 409,
  message: (error) => `Account ID already taken: ${error.accountId}`,
  logLevel: "info",                                    // 高頻度 4xx は info 降格
  logFields: (error) => ({ accountId: error.accountId }), // Datadog の custom attribute
},
```

**今は実装しない**。既存エントリは後方互換のまま、必要になったタイミングで型を拡張すれば追加可能。

---

## レベル3: リクエストコンテキストの注入

監視基盤と連携するために必須になる情報:

- `trace_id` / `span_id`（分散トレースとの相関）
- `request_id` / `user_id`（リクエスト単位での絞り込み）
- `route`（どのエンドポイントで起きたか）
- `env` / `service` / `version`

Node.js の `AsyncLocalStorage` で request-scoped なコンテキストを保持し、`resolveErrorResponse` から拾って Logger に渡す構成が標準的。

```typescript
// middlewares/requestContext.ts（将来追加）
// リクエスト開始時に AsyncLocalStorage.enterWith({ traceId, userId, route })

// resolveErrorResponse 内で
logger.warn("[AppError]", {
  ...getRequestContext(), // traceId, userId, route 等
  type: error.type,
  status: response.status,
  ...extractExtras(error), // 構造化コンテキスト
});
```

この拡張も **エラーハンドリング本体には手を入れずに** 追加できる。

---

## レベル4: Datadog / 監視基盤アダプタ

Logger interface さえあれば、実装を差し替えるだけ。

```typescript
// infrastructure/logger/datadog.ts（将来追加）
import pino from "pino";

export const createDatadogLogger = (): Logger => {
  const pinoLogger = pino({
    /* Datadog 互換の JSON 設定 */
  });
  return {
    warn: (event, fields) => pinoLogger.warn({ event, ...fields }),
    error: (event, fields) => pinoLogger.error({ event, ...fields }),
  };
};
```

`resolveErrorResponse` / errorMap / factory は変更ゼロ。

---

## 拡張しても失われない性質

ログ基盤を積み上げても、**新エラーの追加コストは増えない**:

```text
1. co-located で typed error を定義（1ファイル）
2. errorMap に 1行追加（status + message）
3. （必要なら）logFields を追加
4. テスト追加
```

`resolveErrorResponse` / Logger / onError / ルート は一切触らない、という性質は保たれる。

---

## ロードマップまとめ

| フェーズ | タスク                                              | 影響範囲                                |
| -------- | --------------------------------------------------- | --------------------------------------- |
| 現在     | クライアント向けレスポンス設計                      | 完了                                    |
| 次       | Logger interface を新設し console 呼び出しを置換    | `resolveErrorResponse` の 2 行          |
| その次   | リクエストコンテキスト（trace_id 等）を注入する基盤 | middleware 1 本 + Logger 呼び出しの拡張 |
| その次   | 必要なら errorMap に logLevel / logFields を追加    | 型の拡張（後方互換）                    |
| その次   | Datadog / 監視基盤アダプタの実装                    | Logger interface の実装 1 本            |

順序は前から後ろに積むだけで済む構造になっている。逆順でも欠けた層を飛ばす形でもなく、**下から順に積み上げる** のが自然な進め方。

---

## 最終的な接続先: SLO / SRE 運用の土台

本設計の意義は「クライアントに綺麗なエラーレスポンスを返す」だけではない。最終的に **SLO / SLA を運用可能にするための基礎インフラ** として機能する。

### 因果の全体像

```text
[エラーを型で定義し、発生レイヤーで区別する]
         ↓
[構造化ログに errorType / layer / context が乗る]
         ↓
[Datadog 等で次元別に集計・アラートできる]
         ↓
[「何を失敗としてカウントするか」が設計時に決められる]
         ↓
[SLO / SLI / エラーバジェットが意味のある数値になる]
         ↓
[SLA として顧客・社内に約束できる]
```

**各段階は一つ前が整っていないと機能しない**。SLO を先に決めようとしてもエラー型が区別されていなければ数字が意味を持たない。この設計は **逆算して下流から積み上げている** 状態にある。

### エラー設計が SLO 運用で必須になる理由

SLO 運用の核心は「**カウントすべき失敗とカウントすべきでない失敗を区別する**」こと。型付きエラーがないとこの区別が実現できない。

| エラー                       | HTTP | SLO 上の扱い   | 理由                                       |
| ---------------------------- | ---- | -------------- | ------------------------------------------ |
| `UserAlreadyRegisteredError` | 409  | カウントしない | 業務上の正常拒否。サービス側の失敗ではない |
| `InvalidEmailFormatError`    | 422  | カウントしない | ユーザー入力起因。API は正しく動作している |
| 未知のエラー（Unhandled）    | 500  | カウントする   | サーバ側の契約違反。可用性を毀損する       |
| DB タイムアウト              | 500  | カウントする   | 依存先の契約違反                           |

全部 500 で返す設計だと「カウントしない」行の判定が不可能になり、**SLO が毎日壊れる状態** になる。結果として:

- アラート疲労（本当の障害が埋もれる）
- エラーバジェットが形骸化
- SLA を顧客に約束できない

### 本設計が SLO 運用を支える4つの要素

#### 1. `type` フィールドによる次元化

Datadog 等で `errorType` で絞り込み・集計・アラート条件設定ができる。

```text
errorType:UserAlreadyRegisteredError → 警告不要（業務上の正常失敗）
errorType:* AND status:500            → PagerDuty 発火条件
```

#### 2. エラーの発生レイヤー分類

同じ HTTP ステータスでも「ドメイン層から来たのか、Infrastructure 層から来たのか」で意味が違う。レイヤー別にエラー型を定義している設計なら、ログから起因層を即座に特定できる。

#### 3. HTTP ステータスへの一元マッピング

`errorMap` が唯一の翻訳係なので、「体験として失敗とみなす範囲」を一箇所で定義できる。

- 409（業務上の拒否）: ユーザーは次のアクションに進める → 体験 OK
- 500（予期せぬ失敗）: ユーザーは詰まる → 体験 NG

この境界の変更が1ファイルで完結するため、SLO 定義の見直しにも耐える。

#### 4. 構造化コンテキストによる影響範囲特定

SLO が悪化したとき、「どの顧客セグメント / どのテナントで起きているか」を特定する必要がある。`extras` に `accountId` / `tenantId` 等のドメイン語彙が型付きで乗っていれば、Datadog で次元別にグルーピングして影響範囲を即座に可視化できる。

### 接続に必要な補足整備（別途必要）

エラー設計から SLO 運用に到達するには、以下は **別途整備が必要** で、本設計の範囲外:

- **リクエスト全体のメトリクス**: 成功リクエスト数・失敗リクエスト数の総量（SLI の分母）
- **サンプリング・レート計測**: 高トラフィック時のコスト管理
- **デプロイマーカー**: エラー急増がデプロイ起因か判定するため
- **エラーバジェット消費率の可視化ダッシュボード**
- **アラートポリシー**: どの条件で誰に通知するか

本設計はこれらの **前提条件** を提供する立場にある。型付きエラーという土台があるからこそ、これらの運用プラクティスが意味を持つ。

---

## まとめ

本ディレクトリで扱っている設計は、表面的には「エラーレスポンスの返し方」だが、実質的には **SLO / SRE 運用の前提条件を整える作業**。

> 握りつぶされたエラーは SLO を壊す。型付きエラーは SLO を可能にする。

この視点を持って設計に取り組めば、「なぜここまで細かく分類するのか」「なぜ HTTP status を一元化するのか」の答えが、単なる「コードの綺麗さ」ではなく「運用可能性」であることが明確になる。
