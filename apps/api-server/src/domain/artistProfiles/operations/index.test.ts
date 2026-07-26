import { describe, it, expect } from "vitest";
import {
  toView,
  toPersistence,
  isPublished,
  publish,
  unpublish,
} from "./index";
import { reconstructArtistProfile } from "../factories";

const published = reconstructArtistProfile({
  id: "profile-1",
  artistId: "artist-1",
  published: true,
  name: "Taro",
  tagline: "音で旅する",
  imageUrl: "https://example.com/a.png",
  story: "私の歩み",
  activityInfo: "東京 / ソロ",
  genres: ["bass", "inward"],
  links: [{ type: "x", url: "https://x.com/taro" }],
});

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

  it("publish は Published を返し、元の値は不変", () => {
    const draft = reconstructArtistProfile({
      id: "profile-2",
      artistId: "artist-2",
      published: false,
      name: "Jiro",
    });
    const result = publish(draft);
    expect(result._tag).toBe("Published");
    expect(isPublished(result)).toBe(true);
    expect(isPublished(draft)).toBe(false);
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
