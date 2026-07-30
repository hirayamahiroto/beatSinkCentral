# experiments — 未採用の隔離コード

production（`src/domain` / `src/usecases` / `src/app`）から参照されない、採用可否が未決のコードを置く。
ここに置いたものは route / container / DB に接続しない。

採用が決まったら production へ移し、本ディレクトリから消す。見送りが決まったら消す。
**取り込み済みの提案をここに残さない**（現在地が読めなくなるため）。

## 現在の中身

| 対象 | ステータス | 論点 |
| --- | --- | --- |
| `defineUsecase` | 未決 | `docs/discussions/typed-functional-ddd-user-model.md` |

`defineUsecase` は usecase の deps 過剰提供（`useCase(input, { ...container })`）を
composition root で型エラーにする DI ヘルパ。production の usecase は `Deps` 型で
「使用」は縛れているが「受け渡し」は構造的部分型で素通りするため、その穴を埋める案。
