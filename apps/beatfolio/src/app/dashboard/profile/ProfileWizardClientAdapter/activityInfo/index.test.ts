import { describe, it, expect } from "vitest";
import { composeActivityInfo, parseActivityInfo } from "./index";

describe("composeActivityInfo", () => {
  it("拠点 / 形態 / 所属をラベル付きで連結する", () => {
    expect(
      composeActivityInfo({
        location: "東京",
        activityForm: "solo",
        affiliation: "独立",
      }),
    ).toBe("拠点: 東京 / 形態: ソロ / 所属: 独立");
  });

  it("任意項目が空なら詰めるが形態は常に含める", () => {
    expect(
      composeActivityInfo({
        location: "",
        activityForm: "crew",
        affiliation: undefined,
      }),
    ).toBe("形態: バンド / クルー");
  });
});

describe("parseActivityInfo", () => {
  it("ラベル付き文字列を3項目へ分解する", () => {
    expect(parseActivityInfo("拠点: 東京 / 形態: ソロ / 所属: 独立")).toEqual({
      location: "東京",
      activityForm: "solo",
      affiliation: "独立",
    });
  });

  it("形態だけの文字列を分解する", () => {
    expect(parseActivityInfo("形態: ユニット")).toEqual({
      activityForm: "unit",
    });
  });

  it("形態ラベル内の ' / ' で壊れない（crew）", () => {
    expect(
      parseActivityInfo("拠点: 大阪 / 形態: バンド / クルー / 所属: X"),
    ).toEqual({
      location: "大阪",
      activityForm: "crew",
      affiliation: "X",
    });
  });

  it("null・空文字は空オブジェクトを返す", () => {
    expect(parseActivityInfo(null)).toEqual({});
    expect(parseActivityInfo("")).toEqual({});
  });

  it("フォーマット外の自由文字列は空オブジェクトを返す（誤った復元を避ける）", () => {
    expect(parseActivityInfo("東京で活動中のソロビートボクサー")).toEqual({});
  });

  it("compose の出力を parse で元に戻せる（ラウンドトリップ）", () => {
    const fields = {
      location: "横浜",
      activityForm: "crew" as const,
      affiliation: "クルー名",
    };
    expect(parseActivityInfo(composeActivityInfo(fields))).toEqual(fields);
  });
});
