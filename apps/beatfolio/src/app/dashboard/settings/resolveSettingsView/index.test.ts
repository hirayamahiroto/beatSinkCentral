import { describe, it, expect } from "vitest";
import { ok, err } from "../../../../utils/result";
import { resolveSettingsView } from "./index";

describe("resolveSettingsView", () => {
  it("未登録ならオンボーディングへ redirect する", () => {
    expect(resolveSettingsView(ok({ registered: false }))).toEqual({
      kind: "redirect",
      to: "/onboarding",
    });
  });

  it("登録済みなら取得したデータを描画する", () => {
    const data = {
      registered: true as const,
      email: "player@example.com",
      accountId: "beatboxer",
    };

    expect(resolveSettingsView(ok(data))).toEqual({ kind: "render", data });
  });

  it("認証切れはログイン画面へ redirect する", () => {
    expect(
      resolveSettingsView(err({ kind: "unauthorized", message: "期限切れ" })),
    ).toEqual({ kind: "redirect", to: "/auth/login" });
  });

  it("取得失敗は空データではなく縮退にする", () => {
    expect(
      resolveSettingsView(
        err({
          kind: "unexpected",
          message: "アカウント設定の取得に失敗しました",
        }),
      ),
    ).toEqual({
      kind: "degraded",
      feedback: {
        message: "アカウント設定の取得に失敗しました",
        recovery: { kind: "retry" },
      },
    });
  });
});
