import { describe, it, expect } from "vitest";
import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { toSaveProfileRequest } from "./index";

const baseValues: WizardValues = {
  name: "SAKU",
  imageUrl: "https://example.com/saku.jpg",
  tagline: "口ひとつで、フロアを揺らす。",
  genres: ["Beatbox", "Bass"],
  storyOrigin: "中学のときに動画を見て衝撃を受けた。",
  storyTurning: "初めての大会で負けて火がついた。",
  storyNow: "シーンを盛り上げたい。",
  location: "東京",
  activityForm: "solo",
  affiliation: "独立",
  snsLinks: [
    { platform: "youtube", url: "https://youtube.com/@saku" },
    { platform: "x", url: "https://x.com/saku" },
  ],
  published: false,
};

describe("toSaveProfileRequest", () => {
  it("属性フィールドをそのまま渡し、snsLinks は url だけに落とす", () => {
    const result = toSaveProfileRequest(baseValues);

    expect(result.name).toBe("SAKU");
    expect(result.imageUrl).toBe("https://example.com/saku.jpg");
    expect(result.tagline).toBe("口ひとつで、フロアを揺らす。");
    expect(result.genres).toEqual(["Beatbox", "Bass"]);
    expect(result.snsLinks).toEqual([
      "https://youtube.com/@saku",
      "https://x.com/saku",
    ]);
  });

  it("Story の3問を空行区切りで1つの本文に合成する", () => {
    const result = toSaveProfileRequest(baseValues);

    expect(result.story).toBe(
      "中学のときに動画を見て衝撃を受けた。\n\n初めての大会で負けて火がついた。\n\nシーンを盛り上げたい。",
    );
  });

  it("Story の任意項目が空なら詰めて合成する", () => {
    const result = toSaveProfileRequest({
      ...baseValues,
      storyTurning: "",
      storyNow: undefined,
    });

    expect(result.story).toBe("中学のときに動画を見て衝撃を受けた。");
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
