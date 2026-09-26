import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { reconstructUser } from "../../../../../../domain/users/factories";
import { reconstructArtist } from "../../../../../../domain/artists/factories";
import { reconstructOffer } from "../../../../../../domain/offers/factories";
import { handleThrownError } from "../../../../../../errorMap";
import replaceOfferRoute from "./index";
import { createCapabilityDepsMock } from "../../../../../../infrastructure/capabilities/testDoubles";

const actor = {
  user: reconstructUser({
    id: "user-1",
    subId: "auth0|123",
    email: "t@e.com",
  }),
  artist: reconstructArtist({
    artistId: "artist-1",
    handle: "beatboxer_taro",
    ownerUserId: "user-1",
    profile: null,
  }),
};

const hana = reconstructArtist({
  artistId: "artist-2",
  handle: "hana_bb",
  ownerUserId: "user-2",
  profile: { name: "Hana" },
});

const { deps, artists, offers, resolveActorState } = createCapabilityDepsMock();

vi.mock("../../../../../../infrastructure/capabilities", () => ({
  getCapabilityDeps: () => deps,
}));

const createApp = (sub: string) => {
  const app = new Hono();
  app.use("*", async (c, next) => {
    c.set("auth0User", { sub });
    await next();
  });
  app.route("/:artistId/offers", replaceOfferRoute);
  app.onError(handleThrownError);
  return app;
};

const request = (artistId: string, body: unknown) =>
  createApp("auth0|123").request(`/${artistId}/offers`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const validBody = {
  date: "2026-09-20",
  place: "渋谷 WWW",
  ticketUrl: "https://tickets.example.com/e/1",
  comment: "新曲をやります",
  coPerformers: [
    { name: "Hana", handle: "hana_bb" },
    { name: "Ken", handle: null },
  ],
};

describe("POST /artists/:artistId/offers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T03:00:00.000Z"));
    resolveActorState.mockResolvedValue({ status: "complete", actor });
    artists.findByHandles.mockResolvedValue([hana]);
    offers.findLatestByArtistId.mockResolvedValue(null);
    offers.upsert.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Actor と一致する artistId ならオファーを保存し、offer だけを返す", async () => {
    const res = await request("artist-1", validBody);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toStrictEqual({
      offer: {
        date: "2026-09-20",
        place: "渋谷 WWW",
        ticketUrl: "https://tickets.example.com/e/1",
        comment: "新曲をやります",
        coPerformers: [
          { name: "Hana", handle: "hana_bb" },
          { name: "Ken", handle: null },
        ],
      },
    });
    expect(offers.upsert).toHaveBeenCalledTimes(1);
    expect(offers.upsert.mock.calls[0][0]).toStrictEqual({
      id: expect.any(String),
      artistId: "artist-1",
      date: "2026-09-20",
      place: "渋谷 WWW",
      ticketUrl: "https://tickets.example.com/e/1",
      comment: "新曲をやります",
      coPerformers: [
        { name: "Hana", artistId: "artist-2" },
        { name: "Ken", artistId: null },
      ],
    });
  });

  it("有効なオファーがあれば同じ id で差し替える", async () => {
    offers.findLatestByArtistId.mockResolvedValue(
      reconstructOffer({
        id: "offer-existing",
        artistId: "artist-1",
        date: "2026-09-15",
        place: "旧会場",
        ticketUrl: "https://tickets.example.com/e/0",
        comment: "旧コメント",
        coPerformers: [],
      }),
    );

    const res = await request("artist-1", validBody);

    expect(res.status).toBe(200);
    expect(offers.upsert.mock.calls[0][0].id).toBe("offer-existing");
  });

  it("共演者の handle が見つからなければ 422 を返し、保存しない", async () => {
    artists.findByHandles.mockResolvedValue([]);

    const res = await request("artist-1", validBody);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.code).toBe("CoPerformerNotFoundError");
    expect(offers.upsert).not.toHaveBeenCalled();
  });

  it("日付の形式が不正なら 422 を返し、保存しない", async () => {
    const res = await request("artist-1", { ...validBody, date: "9/20" });

    expect(res.status).toBe(422);
    expect(offers.upsert).not.toHaveBeenCalled();
  });

  it("必須項目が欠けていれば 400 を返し、保存しない", async () => {
    const res = await request("artist-1", { date: "2026-09-20" });

    expect(res.status).toBe(400);
    expect(offers.upsert).not.toHaveBeenCalled();
  });

  it("Actor と一致しない artistId は 404 を返し、保存しない", async () => {
    const res = await request("other-artist", validBody);

    expect(res.status).toBe(404);
    expect(offers.upsert).not.toHaveBeenCalled();
  });

  it("actor が解決できなければ 404 を返し、保存しない", async () => {
    resolveActorState.mockResolvedValue({ status: "unregistered" });

    const res = await request("artist-1", validBody);

    expect(res.status).toBe(404);
    expect(offers.upsert).not.toHaveBeenCalled();
  });
});
