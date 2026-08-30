import { describe, it, expect } from "vitest";
import { resolveReadFailure } from "./index";

describe("resolveReadFailure", () => {
  it("認証切れはログイン画面への redirect にする", () => {
    expect(
      resolveReadFailure({
        kind: "unauthorized",
        message: "ログインの有効期限が切れました",
      }),
    ).toEqual({ kind: "redirect", to: "/auth/login" });
  });

  it("対象不在は notFound にする", () => {
    expect(
      resolveReadFailure({
        kind: "notFound",
        message: "このプレイヤーは見つかりませんでした",
      }),
    ).toEqual({ kind: "notFound" });
  });

  it("上流障害は再試行つきの縮退にする", () => {
    expect(
      resolveReadFailure({ kind: "unexpected", message: "取得に失敗しました" }),
    ).toEqual({
      kind: "degraded",
      feedback: {
        message: "取得に失敗しました",
        recovery: { kind: "retry" },
      },
    });
  });

  it("リクエストが拒否された失敗は再試行を提示しない", () => {
    expect(
      resolveReadFailure({ kind: "rejected", message: "取得に失敗しました" }),
    ).toEqual({
      kind: "degraded",
      feedback: {
        message: "取得に失敗しました",
        recovery: { kind: "none" },
      },
    });
  });
});
