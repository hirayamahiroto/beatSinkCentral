import { describe, it, expect } from "vitest";
import { translateUpstreamBody } from "./index";

describe("translateUpstreamBody", () => {
  it("ProfileNotPublishableError の missingFields を表示ラベルへ解決する", () => {
    expect(
      translateUpstreamBody({
        error: "Profile is not publishable: required fields are missing",
        code: "ProfileNotPublishableError",
        details: { missingFields: ["imageUrl", "links"] },
      }),
    ).toStrictEqual({
      error: "Profile is not publishable: required fields are missing",
      code: "ProfileNotPublishableError",
      missingRequirements: ["アーティスト写真", "SNS / 配信リンク"],
    });
  });

  it("details の形が想定外なら上流ボディをそのまま返す", () => {
    const body = {
      error: "x",
      code: "ProfileNotPublishableError",
      details: {},
    };

    expect(translateUpstreamBody(body)).toBe(body);
  });

  it("他の code は上流ボディをそのまま返す", () => {
    const body = { error: "taken", code: "AccountIdAlreadyTakenError" };

    expect(translateUpstreamBody(body)).toBe(body);
  });
});
