import { describe, it, expect } from "vitest";
import { publishProfile } from "./index";
import type { DraftProfile } from "../../profile";
import { createProfileName } from "../../valueObjects/profileName";
import { createImageUrl } from "../../valueObjects/imageUrl";
import { createStory } from "../../valueObjects/story";
import { createGenre } from "../../valueObjects/genre";
import { createProfileLink } from "../../valueObjects/profileLink";

const emptyDraft = (): DraftProfile => ({
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
});

const completeDraft = (): DraftProfile => {
  const name = createProfileName("Beatboxer");
  const imageUrl = createImageUrl("https://cdn.example.com/a.png");
  const story = createStory("my story");
  const genre = createGenre("loop");
  const link = createProfileLink({ type: "x", url: "https://x.com/a" });
  if (!name.ok || !imageUrl.ok || !story.ok || !genre.ok || !link.ok) {
    throw new Error("fixture invalid");
  }
  return {
    ...emptyDraft(),
    name: name.value,
    imageUrl: imageUrl.value,
    story: story.value,
    genres: [genre.value],
    links: [link.value],
  };
};

describe("publishProfile workflow", () => {
  it("公開必須が揃っていれば ok(PublishedProfile) を返す", () => {
    const result = publishProfile(completeDraft());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("published");
      expect(result.value.name.value).toBe("Beatboxer");
      expect(result.value.genres.length).toBe(1);
    }
  });

  it("空の下書きは全必須項目を missingFields に列挙して err を返す", () => {
    const result = publishProfile(emptyDraft());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ProfileNotPublishableError");
      expect([...result.error.missingFields].sort()).toEqual(
        ["genres", "imageUrl", "links", "name", "story"].sort(),
      );
    }
  });

  it("一部だけ欠けている場合は欠けた項目だけを返す", () => {
    const draft = completeDraft();
    const withoutStory: DraftProfile = { ...draft, story: null };
    const result = publishProfile(withoutStory);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.missingFields).toEqual(["story"]);
    }
  });
});
