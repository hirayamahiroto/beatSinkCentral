import { describe, it, expect } from "vitest";
import type { DraftProfile, PublishedProfile } from "./index";
import { isNonEmpty } from "./index";
import { createProfileName } from "../valueObjects/profileName";

describe("Profile union (draft / published)", () => {
  it("isNonEmpty は空配列を false、要素ありを true に判定する", () => {
    expect(isNonEmpty([])).toBe(false);
    expect(isNonEmpty([1])).toBe(true);
  });

  it("draft は公開必須項目を null で持てる", () => {
    const draft: DraftProfile = {
      status: "draft",
      id: "p1",
      artistId: "a1",
      name: null,
      tagline: null,
      imageUrl: null,
      story: null,
      activityInfo: null,
      genres: [],
      links: [],
    };
    expect(draft.name).toBeNull();
  });

  it("published は name を null にできない（型で必須）", () => {
    const name = createProfileName("A");
    if (!name.ok) throw new Error("fixture");

    const _valid: PublishedProfile = {
      status: "published",
      id: "p1",
      artistId: "a1",
      name: name.value,
      tagline: null,
      imageUrl: { _tag: "ImageUrl", value: "https://x/y.png" },
      story: { _tag: "Story", value: "s" },
      activityInfo: null,
      genres: [{ _tag: "Genre", value: "loop" }],
      links: [
        { _tag: "ProfileLink", type: "x", url: "https://x/a", label: null },
      ],
    };
    void _valid;

    const _invalid: PublishedProfile = {
      status: "published",
      id: "p1",
      artistId: "a1",
      // @ts-expect-error published の name は null にできない
      name: null,
      tagline: null,
      imageUrl: { _tag: "ImageUrl", value: "https://x/y.png" },
      story: { _tag: "Story", value: "s" },
      activityInfo: null,
      genres: [{ _tag: "Genre", value: "loop" }],
      links: [
        { _tag: "ProfileLink", type: "x", url: "https://x/a", label: null },
      ],
    };
    void _invalid;
  });

  it("published の genres は空配列にできない（NonEmptyArray）", () => {
    const name = createProfileName("A");
    if (!name.ok) throw new Error("fixture");

    const _invalid: PublishedProfile = {
      status: "published",
      id: "p1",
      artistId: "a1",
      name: name.value,
      tagline: null,
      imageUrl: { _tag: "ImageUrl", value: "https://x/y.png" },
      story: { _tag: "Story", value: "s" },
      activityInfo: null,
      // @ts-expect-error 空配列は NonEmptyArray に代入できない
      genres: [],
      links: [
        { _tag: "ProfileLink", type: "x", url: "https://x/a", label: null },
      ],
    };
    void _invalid;
  });
});
