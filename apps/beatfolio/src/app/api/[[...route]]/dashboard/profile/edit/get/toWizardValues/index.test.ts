import { describe, it, expect } from "vitest";
import { toWizardValues, type ProfileView } from "./index";

const publishedProfile: ProfileView = {
  name: "SAKU",
  tagline: "口ひとつで、フロアを揺らす。",
  imageUrl: "https://example.com/saku.jpg",
  story: "始めたきっかけ。",
  activityInfo: "拠点: 東京 / 形態: ソロ / 所属: 独立",
  genres: ["Beatbox"],
  links: [
    { type: "youtube", url: "https://youtube.com/@saku", label: null },
    { type: "x", url: "https://x.com/saku", label: null },
  ],
  published: true,
};

describe("toWizardValues", () => {
  it("属性・story・activityInfo・リンクをウィザードの初期値へ変換する", () => {
    expect(toWizardValues(publishedProfile)).toStrictEqual({
      name: "SAKU",
      imageUrl: "https://example.com/saku.jpg",
      tagline: "口ひとつで、フロアを揺らす。",
      genres: ["Beatbox"],
      storyOrigin: "始めたきっかけ。",
      location: "東京",
      activityForm: "solo",
      affiliation: "独立",
      links: [
        { type: "youtube", url: "https://youtube.com/@saku" },
        { type: "x", url: "https://x.com/saku" },
      ],
      published: true,
    });
  });

  it("ウィザードが扱わない label は落とす", () => {
    expect(
      toWizardValues({
        ...publishedProfile,
        links: [
          { type: "other", url: "https://example.com/me", label: "個人HP" },
        ],
      }).links,
    ).toStrictEqual([{ type: "other", url: "https://example.com/me" }]);
  });

  it("null フィールドはキーを含めず、ウィザードの既定値に委ねる", () => {
    expect(
      toWizardValues({
        name: null,
        tagline: null,
        imageUrl: null,
        story: null,
        activityInfo: null,
        genres: [],
        links: [],
        published: false,
      }),
    ).toStrictEqual({ published: false });
  });
});
