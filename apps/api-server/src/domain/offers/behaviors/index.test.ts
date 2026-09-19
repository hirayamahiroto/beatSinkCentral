import { describe, it, expect } from "vitest";
import { createOfferBehaviors } from "./index";
import type { OfferState } from "../entities";

const state: OfferState = {
  id: "offer-1",
  artistId: "artist-1",
  date: { value: "2026-09-20" },
  place: { value: "渋谷 WWW" },
  ticketUrl: { value: "https://tickets.example.com/e/1" },
  comment: { value: "新曲をやります" },
  coPerformers: [
    { name: "Hana", artist: { artistId: "artist-2", handle: "hana_bb" } },
    { name: "Ken", artist: null },
  ],
};

describe("createOfferBehaviors", () => {
  it("getDate は開催日を YYYY-MM-DD で返す", () => {
    expect(createOfferBehaviors(state).getDate()).toBe("2026-09-20");
  });

  it("toPersistence は共演者を artistId（未登録は null）で永続化データへ渡す", () => {
    expect(createOfferBehaviors(state).toPersistence()).toStrictEqual({
      id: "offer-1",
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

  it("toView は共演者を handle（未登録は null）で返し、id / artistId を含めない", () => {
    expect(createOfferBehaviors(state).toView()).toStrictEqual({
      date: "2026-09-20",
      place: "渋谷 WWW",
      ticketUrl: "https://tickets.example.com/e/1",
      comment: "新曲をやります",
      coPerformers: [
        { name: "Hana", handle: "hana_bb" },
        { name: "Ken", handle: null },
      ],
    });
  });

  it("revise は id / artistId を保ったまま内容を差し替え、元の Offer は変えない", () => {
    const original = createOfferBehaviors(state);

    const revised = original.revise({
      date: { value: "2026-10-01" },
      place: { value: "新宿 LOFT" },
      ticketUrl: { value: "https://tickets.example.com/e/2" },
      comment: { value: "差し替え後" },
      coPerformers: [],
    });

    expect(revised.toPersistence()).toStrictEqual({
      id: "offer-1",
      artistId: "artist-1",
      date: "2026-10-01",
      place: "新宿 LOFT",
      ticketUrl: "https://tickets.example.com/e/2",
      comment: "差し替え後",
      coPerformers: [],
    });
    expect(original.getDate()).toBe("2026-09-20");
  });
});
