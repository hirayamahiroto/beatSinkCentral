import { describe, it, expect } from "vitest";
import { ok, err } from "../../../utils/result";
import { resolveDashboardView } from "./index";

describe("resolveDashboardView", () => {
  it("未登録ならオンボーディングへ redirect する", () => {
    expect(resolveDashboardView(ok({ registered: false }))).toEqual({
      kind: "redirect",
      to: "/onboarding",
    });
  });

  it("登録済みなら取得したデータを描画する", () => {
    const data = { registered: true as const, artist: null };

    expect(resolveDashboardView(ok(data))).toEqual({
      kind: "render",
      data,
    });
  });

  it("認証切れはログイン画面へ redirect する", () => {
    expect(
      resolveDashboardView(err({ kind: "unauthorized", message: "期限切れ" })),
    ).toEqual({ kind: "redirect", to: "/auth/login" });
  });

  it("取得失敗は空データではなく縮退にする", () => {
    expect(
      resolveDashboardView(
        err({
          kind: "unexpected",
          message: "ダッシュボードの取得に失敗しました",
        }),
      ),
    ).toEqual({
      kind: "degraded",
      feedback: {
        message: "ダッシュボードの取得に失敗しました",
        recovery: { kind: "retry" },
      },
    });
  });
});
