import { describe, it, expect } from "vitest";
import { toSaveOfferRequest } from "./index";

describe("toSaveOfferRequest", () => {
  it("空の handle は未登録として null に変換し、入力済みの handle は前後空白を除いて渡す", () => {
    expect(
      toSaveOfferRequest({
        date: "2026-09-20",
        place: "渋谷 WWW",
        ticketUrl: "https://tickets.example.com/e/1",
        comment: "新曲をやります",
        coPerformers: [
          { name: "Hana", handle: " hana_bb " },
          { name: "Ken", handle: "   " },
        ],
      }),
    ).toStrictEqual({
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
});
