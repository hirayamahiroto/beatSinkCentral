import { describe, it, expect } from "vitest";
import {
  toView,
  toPublishedView,
  toPersistence,
  isPublished,
  publish,
  unpublish,
} from "./index";
import { reconstructArtistProfile } from "../factories";
import { isProfileNotPublishableError } from "../policies/assertProfilePublishable";
import { unwrapOrThrow } from "../../../utils/result";

const published = unwrapOrThrow(
  publish(
    reconstructArtistProfile({
      id: "profile-1",
      artistId: "artist-1",
      published: false,
      name: "Taro",
      tagline: "音で旅する",
      imageUrl: "https://example.com/a.png",
      story: "私の歩み",
      activityInfo: "東京 / ソロ",
      genres: ["bass", "inward"],
      links: [{ type: "x", url: "https://x.com/taro" }],
    }),
  ),
  "fixture must be publishable",
);

describe("artistProfile operations", () => {
  it("toView は VO 構造を露出せずプリミティブなプレゼンテーションデータを返す", () => {
    expect(toView(published)).toEqual({
      name: "Taro",
      tagline: "音で旅する",
      imageUrl: "https://example.com/a.png",
      story: "私の歩み",
      activityInfo: "東京 / ソロ",
      genres: ["bass", "inward"],
      links: [{ type: "x", url: "https://x.com/taro", label: null }],
      published: true,
    });
  });

  it("toPersistence は id / artistId を含む永続化データを返す", () => {
    expect(toPersistence(published)).toEqual({
      id: "profile-1",
      artistId: "artist-1",
      name: "Taro",
      tagline: "音で旅する",
      imageUrl: "https://example.com/a.png",
      story: "私の歩み",
      activityInfo: "東京 / ソロ",
      genres: ["bass", "inward"],
      links: [{ type: "x", url: "https://x.com/taro", label: null }],
      published: true,
    });
  });

  it("isPublished は _tag に基づいて公開状態を返す", () => {
    expect(isPublished(published)).toBe(true);
  });

  it("unpublish は Draft を返し、元の値は不変", () => {
    const draft = unpublish(published);
    expect(draft._tag).toBe("Draft");
    expect(isPublished(draft)).toBe(false);
    expect(isPublished(published)).toBe(true);
  });

  it("publish は最小核が揃っていれば ok(Published) を返し、元の値は不変", () => {
    const draft = unpublish(published);
    const result = publish(draft);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value._tag).toBe("Published");
      expect(isPublished(result.value)).toBe(true);
    }
    expect(isPublished(draft)).toBe(false);
  });

  it("publish は最小核が欠けていれば err(ProfileNotPublishableError) を返す", () => {
    const draft = reconstructArtistProfile({
      id: "profile-2",
      artistId: "artist-2",
      published: false,
      name: "Jiro",
    });

    const result = publish(draft);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isProfileNotPublishableError(result.error)).toBe(true);
      expect(result.error.missingFields).toEqual([
        "imageUrl",
        "story",
        "genres",
        "links",
      ]);
    }
  });

  it("toPublishedView は必須項目を非 null・非空で返す", () => {
    expect(toPublishedView(published)).toEqual({
      name: "Taro",
      tagline: "音で旅する",
      imageUrl: "https://example.com/a.png",
      story: "私の歩み",
      activityInfo: "東京 / ソロ",
      genres: ["bass", "inward"],
      links: [{ type: "x", url: "https://x.com/taro", label: null }],
      published: true,
    });
  });

  it("未設定フィールドは null / 空配列で返す", () => {
    const draft = reconstructArtistProfile({
      id: "profile-3",
      artistId: "artist-3",
      published: false,
    });
    const view = toView(draft);
    expect(view.name).toBeNull();
    expect(view.story).toBeNull();
    expect(view.genres).toEqual([]);
  });
});
