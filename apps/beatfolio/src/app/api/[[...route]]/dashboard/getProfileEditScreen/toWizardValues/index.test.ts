import { describe, it, expect } from "vitest";
import { toWizardValues, type ProfileView } from "./index";

const publishedProfile: ProfileView = {
  attributes: {
    name: "SAKU",
    imageUrl: "https://example.com/saku.jpg",
    tagline: "口ひとつで、フロアを揺らす。",
    genres: ["Beatbox"],
    activityInfo: "拠点: 東京 / 形態: ソロ / 所属: 独立",
  },
  story: {
    chapters: [
      { key: "beginning", body: "始めたきっかけ。" },
      { key: "turning_point", body: "転機。" },
    ],
  },
  links: [
    { linkTypeCode: "youtube", url: "https://youtube.com/@saku" },
    { linkTypeCode: "x", url: "https://x.com/saku" },
  ],
  published: true,
};

describe("toWizardValues", () => {
  it("属性・Story章・activityInfo・リンクをウィザードの初期値へ変換する", () => {
    expect(toWizardValues(publishedProfile)).toStrictEqual({
      name: "SAKU",
      imageUrl: "https://example.com/saku.jpg",
      tagline: "口ひとつで、フロアを揺らす。",
      genres: ["Beatbox"],
      chapters: {
        beginning: "始めたきっかけ。",
        turning_point: "転機。",
      },
      location: "東京",
      activityForm: "solo",
      affiliation: "独立",
      links: [
        { type: "youtube", url: "https://youtube.com/@saku" },
        { type: "x", url: "https://x.com/saku" },
      ],
    });
  });

  it("リンク種別コードはウィザードの type へ写す", () => {
    expect(
      toWizardValues({
        ...publishedProfile,
        links: [{ linkTypeCode: "other", url: "https://example.com/me" }],
      }).links,
    ).toStrictEqual([{ type: "other", url: "https://example.com/me" }]);
  });

  it("Story章が無ければ chapters キーを含めない", () => {
    expect(
      toWizardValues({
        attributes: {
          name: null,
          imageUrl: null,
          tagline: null,
          genres: [],
          activityInfo: null,
        },
        story: { chapters: [] },
        links: [],
        published: false,
      }),
    ).toStrictEqual({});
  });
});
