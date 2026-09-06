import { describe, it, expect } from "vitest";
import {
  assessPublishability,
  enforcePublishInvariant,
  ensurePublishable,
} from "./index";
import { reconstructArtistProfile } from "../../factories";

const fullContent = {
  id: "profile-1",
  artistId: "artist-1",
  published: false,
  name: "Taro",
  imageUrl: "https://example.com/a.png",
  chapters: [{ questionCode: "beginning", body: "私の歩み" }],
  genres: ["bass"],
  links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
};

describe("assessPublishability の missingFields", () => {
  it("最小核が揃っていれば空配列を返す", () => {
    const profile = reconstructArtistProfile(fullContent);

    expect(assessPublishability(profile).missingFields).toEqual([]);
  });

  it("不足しているフィールド名を列挙する", () => {
    const profile = reconstructArtistProfile({
      ...fullContent,
      chapters: [],
      links: [],
    });

    expect(assessPublishability(profile).missingFields).toEqual([
      "story",
      "links",
    ]);
  });

  it("始まりの章が無く転機・コンセプトのみでは不足扱いになる", () => {
    const profile = reconstructArtistProfile({
      ...fullContent,
      chapters: [{ questionCode: "turning_point", body: "転機" }],
    });

    expect(assessPublishability(profile).missingFields).toEqual(["story"]);
  });

  it("転機・コンセプトが無くても始まりの章があれば不足扱いにならない", () => {
    const profile = reconstructArtistProfile({
      ...fullContent,
      chapters: [{ questionCode: "beginning", body: "私の歩み" }],
    });

    expect(assessPublishability(profile).missingFields).toEqual([]);
  });

  it("タグライン・活動情報は公開ゲート対象外", () => {
    const profile = reconstructArtistProfile({
      ...fullContent,
      tagline: undefined,
      activityInfo: undefined,
    });

    expect(assessPublishability(profile).missingFields).toEqual([]);
  });
});

describe("assessPublishability", () => {
  it("最小核が揃っていれば ok:true と空の missingFields を返す", () => {
    expect(
      assessPublishability(reconstructArtistProfile(fullContent)),
    ).toStrictEqual({
      ok: true,
      missingFields: [],
    });
  });

  it("不足があれば ok:false と不足フィールドを返す", () => {
    expect(
      assessPublishability(
        reconstructArtistProfile({ ...fullContent, chapters: [], links: [] }),
      ),
    ).toStrictEqual({ ok: false, missingFields: ["story", "links"] });
  });
});

describe("ensurePublishable", () => {
  it("最小核が揃っていれば ok を返す", () => {
    const result = ensurePublishable(reconstructArtistProfile(fullContent));

    expect(result.ok).toBe(true);
  });

  it("不足があれば不足フィールドを載せた err を返す", () => {
    const result = ensurePublishable(
      reconstructArtistProfile({ ...fullContent, chapters: [], links: [] }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ProfileNotPublishableError");
      expect(result.error.missingFields).toEqual(["story", "links"]);
    }
  });
});

describe("enforcePublishInvariant", () => {
  it("公開中に公開条件を割ったプロフィールは非公開へ降ろす", () => {
    const profile = reconstructArtistProfile({
      ...fullContent,
      published: true,
      imageUrl: undefined,
    });

    expect(enforcePublishInvariant(profile).isPublished()).toBe(false);
  });

  it("公開中でも条件を満たしていれば公開のままにする", () => {
    const profile = reconstructArtistProfile({
      ...fullContent,
      published: true,
    });

    expect(enforcePublishInvariant(profile).isPublished()).toBe(true);
  });

  it("未公開のプロフィールは条件を満たしていても公開しない", () => {
    const profile = reconstructArtistProfile({
      ...fullContent,
      published: false,
    });

    expect(enforcePublishInvariant(profile).isPublished()).toBe(false);
  });
});
