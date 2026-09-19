import { describe, it, expect, vi, afterEach } from "vitest";
import { createOfferContent, createOffer, reconstructOffer } from "./index";

const contentInput = {
  date: "2026-09-20",
  place: "渋谷 WWW",
  ticketUrl: "https://tickets.example.com/e/1",
  comment: "新曲をやります",
  coPerformers: [
    { name: "Hana", artist: { artistId: "artist-2", handle: "hana_bb" } },
    { name: "Ken", artist: null },
  ],
};

describe("createOfferContent", () => {
  it("各項目を VO に検証し、共演者の順序を保つ", () => {
    const result = createOfferContent(contentInput);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.date.value).toBe("2026-09-20");
      expect(result.value.place.value).toBe("渋谷 WWW");
      expect(result.value.ticketUrl.value).toBe(
        "https://tickets.example.com/e/1",
      );
      expect(result.value.comment.value).toBe("新曲をやります");
      expect(result.value.coPerformers).toStrictEqual([
        { name: "Hana", artist: { artistId: "artist-2", handle: "hana_bb" } },
        { name: "Ken", artist: null },
      ]);
    }
  });

  it.each([
    ["date", { date: "2026/09/20" }, "InvalidCalendarDateFormatError"],
    ["place", { place: "" }, "InvalidPlaceFormatError"],
    ["ticketUrl", { ticketUrl: "not-a-url" }, "InvalidTicketUrlFormatError"],
    ["comment", { comment: "  " }, "InvalidOfferCommentFormatError"],
    [
      "coPerformers",
      { coPerformers: [{ name: "", artist: null }] },
      "InvalidCoPerformerFormatError",
    ],
  ])("%s が不正なら対応する VO のエラーを返す", (_, patch, errorType) => {
    const result = createOfferContent({ ...contentInput, ...patch });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe(errorType);
    }
  });
});

describe("createOffer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("id を採番し、artistId と内容を永続化データへ渡す", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111",
    );
    const content = createOfferContent(contentInput);
    expect(content.ok).toBe(true);
    if (!content.ok) return;

    const offer = createOffer({ artistId: "artist-1", content: content.value });

    expect(offer.toPersistence()).toStrictEqual({
      id: "11111111-1111-4111-8111-111111111111",
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
});

describe("reconstructOffer", () => {
  it("指定した id / artistId と内容を復元する", () => {
    const offer = reconstructOffer({
      id: "offer-1",
      artistId: "artist-1",
      ...contentInput,
    });

    expect(offer.toPersistence().id).toBe("offer-1");
    expect(offer.toPersistence().artistId).toBe("artist-1");
    expect(offer.toView()).toStrictEqual({
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

  it("保存済みの値が VO の制約に反していれば例外を投げる", () => {
    expect(() =>
      reconstructOffer({
        id: "offer-1",
        artistId: "artist-1",
        ...contentInput,
        date: "broken",
      }),
    ).toThrow("reconstructOffer: stored offer has invalid field values");
  });
});
