import { describe, it, expect } from "vitest";
import { resolveProfileViewFrom } from "./index";

describe("resolveProfileViewFrom", () => {
  it.each(["announce", "share", "search", "invite", "none"] as const)(
    "PRD の 5 値 %s をそのまま返す",
    (value) => {
      expect(resolveProfileViewFrom(value)).toBe(value);
    },
  );

  it("パラメータが無ければ none", () => {
    expect(resolveProfileViewFrom(undefined)).toBe("none");
  });

  it("5 値以外の文字列は none に倒す", () => {
    expect(resolveProfileViewFrom("unknown")).toBe("none");
  });

  it("同名パラメータが複数あれば none に倒す", () => {
    expect(resolveProfileViewFrom(["announce", "share"])).toBe("none");
  });
});
