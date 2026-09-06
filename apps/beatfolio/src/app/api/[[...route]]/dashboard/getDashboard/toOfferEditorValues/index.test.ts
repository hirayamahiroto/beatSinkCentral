import { describe, it, expect } from "vitest";
import { toOfferEditorValues } from "./index";

describe("toOfferEditorValues", () => {
  it("未登録の共演者（handle: null）はフォーム用に空文字へ変換し、他はそのまま渡す", () => {
    expect(
      toOfferEditorValues({
        date: "2026-09-20",
        place: "渋谷 WWW",
        ticketUrl: "https://tickets.example.com/e/1",
        comment: "新曲をやります",
        coPerformers: [
          { name: "Hana", handle: "hana_bb" },
          { name: "Ken", handle: null },
        ],
      }),
    ).toStrictEqual({
      date: "2026-09-20",
      place: "渋谷 WWW",
      ticketUrl: "https://tickets.example.com/e/1",
      comment: "新曲をやります",
      coPerformers: [
        { name: "Hana", handle: "hana_bb" },
        { name: "Ken", handle: "" },
      ],
    });
  });
});
