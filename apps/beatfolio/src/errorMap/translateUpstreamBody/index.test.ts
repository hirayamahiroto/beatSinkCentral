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

  it("CoPerformerNotFoundError は details の handle を埋め込んだ日本語文言にする", () => {
    expect(
      translateUpstreamBody({
        error: "Co-performer not found: hana_bb",
        code: "CoPerformerNotFoundError",
        details: { handle: "hana_bb" },
      }),
    ).toStrictEqual({
      error: "共演者のハンドル「hana_bb」は登録されていません",
      code: "CoPerformerNotFoundError",
    });
  });

  it("CoPerformerNotFoundError の details が想定外なら上流ボディをそのまま返す", () => {
    const body = { error: "x", code: "CoPerformerNotFoundError" };

    expect(translateUpstreamBody(body)).toBe(body);
  });

  it("OfferDatePassedError は日本語文言にする", () => {
    expect(
      translateUpstreamBody({
        error: "Offer date has already passed",
        code: "OfferDatePassedError",
      }),
    ).toStrictEqual({
      error: "開催日を過ぎた日付は登録できません",
      code: "OfferDatePassedError",
    });
  });

  it("他の code は上流ボディをそのまま返す", () => {
    const body = { error: "taken", code: "HandleAlreadyTakenError" };

    expect(translateUpstreamBody(body)).toBe(body);
  });
});
