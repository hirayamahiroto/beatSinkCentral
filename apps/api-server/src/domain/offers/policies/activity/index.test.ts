import { describe, it, expect } from "vitest";
import { isOfferActiveAt, ensureOfferDateNotPassed } from "./index";
import { reconstructOffer } from "../../factories";

const offerOn = (date: string) =>
  reconstructOffer({
    id: "offer-1",
    artistId: "artist-1",
    date,
    place: "渋谷 WWW",
    ticketUrl: "https://tickets.example.com/e/1",
    comment: "新曲をやります",
    coPerformers: [],
  });

describe("isOfferActiveAt", () => {
  it("開催日より前なら有効", () => {
    expect(
      isOfferActiveAt(offerOn("2026-09-20"), new Date("2026-09-10T12:00:00Z")),
    ).toBe(true);
  });

  it("開催日当日は日本時間の終わりまで有効", () => {
    expect(
      isOfferActiveAt(offerOn("2026-09-20"), new Date("2026-09-20T14:59:59Z")),
    ).toBe(true);
  });

  it("日本時間で日付が変わった瞬間に無効になる", () => {
    expect(
      isOfferActiveAt(offerOn("2026-09-20"), new Date("2026-09-20T15:00:00Z")),
    ).toBe(false);
  });

  it("開催日を過ぎていれば無効", () => {
    expect(
      isOfferActiveAt(offerOn("2026-09-20"), new Date("2026-10-01T00:00:00Z")),
    ).toBe(false);
  });
});

describe("ensureOfferDateNotPassed", () => {
  it("日本時間の今日以降の日付は ok", () => {
    expect(
      ensureOfferDateNotPassed(
        { value: "2026-09-20" },
        new Date("2026-09-20T14:59:59Z"),
      ).ok,
    ).toBe(true);
  });

  it("日本時間で過ぎた日付は err(OfferDatePassedError)", () => {
    const result = ensureOfferDateNotPassed(
      { value: "2026-09-20" },
      new Date("2026-09-20T15:00:00Z"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("OfferDatePassedError");
    }
  });
});
