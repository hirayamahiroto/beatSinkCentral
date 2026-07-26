import { describe, it, expect } from "vitest";
import { assertProfilePublishable } from "./index";
import type { DraftProfile } from "../profile";
import { createProfileName } from "../valueObjects/profileName";
import { createImageUrl } from "../valueObjects/imageUrl";
import { createStory } from "../valueObjects/story";
import { createGenre } from "../valueObjects/genre";
import { createProfileLink } from "../valueObjects/profileLink";

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

describe("assertProfilePublishable", () => {
  it("公開必須が揃っていれば PublishedProfile へ絞り込んで ok を返す", () => {
    const result = assertProfilePublishable(completeDraft());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("published");
      expect(result.value.name.value).toBe("Beatboxer");
    }
  });

  it("欠落があれば missingFields を列挙して err を返す", () => {
    const result = assertProfilePublishable(emptyDraft());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect([...result.error.missingFields].sort()).toEqual(
        ["genres", "imageUrl", "links", "name", "story"].sort(),
      );
    }
  });
});
