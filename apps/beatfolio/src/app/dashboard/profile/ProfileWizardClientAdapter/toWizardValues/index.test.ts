import { describe, it, expect } from "vitest";
import { toWizardValues, type ProfileView } from "./index";

const publishedProfile: ProfileView = {
  name: "SAKU",
  tagline: "口ひとつで、フロアを揺らす。",
  imageUrl: "https://example.com/saku.jpg",
  story: "始めたきっかけ。",
  activityInfo: "拠点: 東京 / 形態: ソロ / 所属: 独立",
  genres: ["Beatbox"],
  snsLinks: ["https://youtube.com/@saku", "https://x.com/saku"],
  published: true,
};

describe("toWizardValues", () => {
  it("属性フィールドと published をそのまま渡す", () => {
    const values = toWizardValues(publishedProfile);

    expect(values.name).toBe("SAKU");
    expect(values.tagline).toBe("口ひとつで、フロアを揺らす。");
    expect(values.imageUrl).toBe("https://example.com/saku.jpg");
    expect(values.genres).toEqual(["Beatbox"]);
    expect(values.published).toBe(true);
  });

  it("story 本文を storyOrigin に戻す", () => {
    const values = toWizardValues(publishedProfile);

    expect(values.storyOrigin).toBe("始めたきっかけ。");
  });

  it("activityInfo を 拠点 / 形態 / 所属 に分解する", () => {
    const values = toWizardValues(publishedProfile);

    expect(values.location).toBe("東京");
    expect(values.activityForm).toBe("solo");
    expect(values.affiliation).toBe("独立");
  });

  it("SNS の URL から platform を推定する", () => {
    const values = toWizardValues(publishedProfile);

    expect(values.snsLinks).toEqual([
      { platform: "youtube", url: "https://youtube.com/@saku" },
      { platform: "x", url: "https://x.com/saku" },
    ]);
  });

  it("判別できない URL は other にフォールバックする", () => {
    const values = toWizardValues({
      ...publishedProfile,
      snsLinks: ["https://example.com/me", "not-a-url"],
    });

    expect(values.snsLinks).toEqual([
      { platform: "other", url: "https://example.com/me" },
      { platform: "other", url: "not-a-url" },
    ]);
  });

  it("null フィールドはキーを含めず、ウィザードの既定値に委ねる", () => {
    const values = toWizardValues({
      name: null,
      tagline: null,
      imageUrl: null,
      story: null,
      activityInfo: null,
      genres: [],
      snsLinks: [],
      published: false,
    });

    expect(values.name).toBeUndefined();
    expect(values.storyOrigin).toBeUndefined();
    expect(values.location).toBeUndefined();
    expect(values.snsLinks).toBeUndefined();
    expect("genres" in values).toBe(false);
    expect(values.published).toBe(false);
  });
});
