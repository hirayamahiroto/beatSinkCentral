import { describe, it, expect } from "vitest";
import { createCalendarDate } from "./index";

describe("createCalendarDate", () => {
  it("YYYY-MM-DD 形式の値で生成し、前後の空白を正規化する", () => {
    const result = createCalendarDate(" 2026-09-20 ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("2026-09-20");
    }
  });

  it("うるう日は実在する日付として受け付ける", () => {
    expect(createCalendarDate("2028-02-29").ok).toBe(true);
  });

  it.each([
    ["空文字", ""],
    ["区切りが違う", "2026/09/20"],
    ["桁が足りない", "2026-9-20"],
    ["時刻付き", "2026-09-20T00:00:00Z"],
    ["実在しない日", "2026-02-30"],
    ["実在しない月", "2026-13-01"],
  ])("%s は err(InvalidCalendarDateFormatError) を返す", (_, value) => {
    const result = createCalendarDate(value);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidCalendarDateFormatError");
    }
  });
});
