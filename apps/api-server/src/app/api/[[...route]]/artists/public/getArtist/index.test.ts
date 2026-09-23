import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { reconstructStoredProfile } from "../../../../../../domain/artistProfiles/factories";
import type { PublishedProfile } from "../../../../../../domain/artistProfiles/entities";
import { handleAppError } from "../../../../../../errorMap";
import getArtistRoute from "./index";
import { createCapabilityDepsMock } from "../../../../../../infrastructure/capabilities/testDoubles";

const { deps, artistProfiles } = createCapabilityDepsMock();

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => deps,
}));

const publishedProfile = (): PublishedProfile => {
  const state = reconstructStoredProfile({
    id: "p1",
    artistId: "0d7fbb2e-5f6c-4d3a-9c1e-2b8f4a6d7e90",
    published: true,
    name: "Taro",
    imageUrl: "https://example.com/a.png",
    chapters: [{ questionCode: "beginning", body: "私の歩み" }],
    genres: ["bass"],
    links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
  });
  if (state.kind !== "published") throw new Error("fixture must be published");
  return state;
};

const createApp = () => {
  const app = new Hono();
  app.route("/:handle", getArtistRoute);
  app.onError(handleAppError);
  return app;
};

describe("GET /artists/:handle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("公開プロフィールを handle と view で返す", async () => {
    artistProfiles.findPublishedByHandle.mockResolvedValue(publishedProfile());

    const res = await createApp().request("/beatboxer_taro", { method: "GET" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.handle).toBe("beatboxer_taro");
    expect(body.artistId).toBe("0d7fbb2e-5f6c-4d3a-9c1e-2b8f4a6d7e90");
    expect(body.profile.attributes.name).toBe("Taro");
    expect(body.profile.story.chapters).toStrictEqual([
      { key: "beginning", body: "私の歩み" },
    ]);
    expect(body.profile.presentation).toStrictEqual({ patternCode: null });
    expect(artistProfiles.findPublishedByHandle).toHaveBeenCalledWith(
      "beatboxer_taro",
    );
  });

  it("公開プロフィールが無ければ 404 を返す", async () => {
    artistProfiles.findPublishedByHandle.mockResolvedValue(null);

    const res = await createApp().request("/beatboxer_taro", { method: "GET" });

    expect(res.status).toBe(404);
  });

  it("書式不正な handle は DB へ到達せず 422 を返す", async () => {
    const res = await createApp().request("/not%20an%20id", { method: "GET" });

    expect(res.status).toBe(422);
    expect(await res.json()).toStrictEqual({
      error: "Invalid handle format",
      code: "InvalidHandleFormatError",
    });
    expect(artistProfiles.findPublishedByHandle).not.toHaveBeenCalled();
  });

  it("255 文字を超える handle は param 検証で 400 を返す", async () => {
    const res = await createApp().request(`/${"a".repeat(256)}`, {
      method: "GET",
    });

    expect(res.status).toBe(400);
    expect(artistProfiles.findPublishedByHandle).not.toHaveBeenCalled();
  });
});
