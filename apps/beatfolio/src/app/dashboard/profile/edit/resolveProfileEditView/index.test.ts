import { describe, it, expect } from "vitest";
import { ok, err } from "../../../../../utils/result";
import { resolveProfileEditView } from "./index";

describe("resolveProfileEditView", () => {
  it("未登録ならオンボーディングへ redirect する", () => {
    expect(resolveProfileEditView(ok({ registered: false }))).toEqual({
      kind: "redirect",
      to: "/onboarding",
    });
  });

  it("登録済みなら取得したデータを描画する", () => {
    const data = {
      registered: true as const,
      email: "player@example.com",
      linkTypeOptions: [],
      defaultValues: null,
    };

    expect(resolveProfileEditView(ok(data))).toEqual({ kind: "render", data });
  });

  it("認証切れはログイン画面へ redirect する", () => {
    expect(
      resolveProfileEditView(
        err({ kind: "unauthorized", message: "期限切れ" }),
      ),
    ).toEqual({ kind: "redirect", to: "/auth/login" });
  });

  it("取得失敗は空データではなく縮退にする", () => {
    expect(
      resolveProfileEditView(
        err({
          kind: "unexpected",
          message: "プロフィール編集画面の取得に失敗しました",
        }),
      ),
    ).toEqual({
      kind: "degraded",
      feedback: {
        message: "プロフィール編集画面の取得に失敗しました",
        recovery: { kind: "retry" },
      },
    });
  });
});
