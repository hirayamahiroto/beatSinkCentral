import { describe, it, expect } from "vitest";
import { resolvePublishRequirementLabels } from "./index";

describe("resolvePublishRequirementLabels", () => {
  it("公開必須項目のコードを表示ラベルへ解決する", () => {
    expect(
      resolvePublishRequirementLabels([
        "name",
        "imageUrl",
        "story",
        "genres",
        "links",
      ]),
    ).toStrictEqual([
      "活動名",
      "アーティスト写真",
      "Story",
      "ジャンル",
      "SNS / 配信リンク",
    ]);
  });

  it("不足項目が無ければ空配列を返す", () => {
    expect(resolvePublishRequirementLabels([])).toStrictEqual([]);
  });

  it("未知のコードは落として既知のものだけ返す", () => {
    expect(resolvePublishRequirementLabels(["story", "unknown"])).toStrictEqual(
      ["Story"],
    );
  });
});
