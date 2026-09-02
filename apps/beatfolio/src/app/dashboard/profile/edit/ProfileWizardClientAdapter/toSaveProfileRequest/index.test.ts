import { describe, it, expect } from "vitest";
import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { toSaveProfileRequest } from "./index";

const baseValues: WizardValues = {
  name: "SAKU",
  imageUrl: "https://example.com/saku.jpg",
  tagline: "口ひとつで、フロアを揺らす。",
  genres: ["Beatbox", "Bass"],
  chapters: {
    beginning: "中学のときに動画を見て衝撃を受けた。",
    turning_point: "初めての大会で負けて火がついた。",
    concept: "シーンを盛り上げたい。",
  },
  location: "東京",
  activityForm: "solo",
  affiliation: "独立",
  links: [
    { type: "youtube", url: "https://youtube.com/@saku" },
    { type: "x", url: "https://x.com/saku" },
  ],
};

describe("toSaveProfileRequest", () => {
  it("属性フィールドをそのまま渡し、links は種別と url を保持する", () => {
    const result = toSaveProfileRequest(baseValues);

    expect(result.name).toBe("SAKU");
    expect(result.imageUrl).toBe("https://example.com/saku.jpg");
    expect(result.tagline).toBe("口ひとつで、フロアを揺らす。");
    expect(result.genres).toEqual(["Beatbox", "Bass"]);
    expect(result.links).toEqual([
      { type: "youtube", url: "https://youtube.com/@saku" },
      { type: "x", url: "https://x.com/saku" },
    ]);
  });

  it("Story の3問をそれぞれ questionCode 付きの章として渡す", () => {
    const result = toSaveProfileRequest(baseValues);

    expect(result.chapters).toEqual([
      {
        questionCode: "beginning",
        body: "中学のときに動画を見て衝撃を受けた。",
      },
      {
        questionCode: "turning_point",
        body: "初めての大会で負けて火がついた。",
      },
      { questionCode: "concept", body: "シーンを盛り上げたい。" },
    ]);
  });

  it("未回答（空白のみ）の問いは章として送らない", () => {
    const result = toSaveProfileRequest({
      ...baseValues,
      chapters: {
        beginning: "中学のときに動画を見て衝撃を受けた。",
        turning_point: "",
        concept: "   ",
      },
    });

    expect(result.chapters).toEqual([
      {
        questionCode: "beginning",
        body: "中学のときに動画を見て衝撃を受けた。",
      },
    ]);
  });

  it("活動情報を拠点 / 形態 / 所属のラベル付き文字列に合成する", () => {
    const result = toSaveProfileRequest(baseValues);

    expect(result.activityInfo).toBe("拠点: 東京 / 形態: ソロ / 所属: 独立");
  });

  it("活動の任意項目が無くても形態は常に含める", () => {
    const result = toSaveProfileRequest({
      ...baseValues,
      location: "",
      affiliation: undefined,
      activityForm: "crew",
    });

    expect(result.activityInfo).toBe("形態: バンド / クルー");
  });
});
