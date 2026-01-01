import { describe, it, expect } from "vitest";
import { createSub } from "./index";

describe("Sub", () => {
  describe("createSub", () => {
    it("有効なsubでオブジェクトを作成できる", () => {
      const validIds = [
        "auth0|123456789",
        "google-oauth2|123456789",
        "github|123456789",
        "simple-id",
      ];

      validIds.forEach((id) => {
        const sub = createSub(id);
        expect(sub.value).toBe(id);
      });
    });

    it("空文字列ではエラーをスローする", () => {
      expect(() => createSub("")).toThrow("sub is required");
    });

    it("空白のみの文字列ではエラーをスローする", () => {
      const whitespaceStrings = ["   ", "\t", "\n", "  \t\n  "];

      whitespaceStrings.forEach((str) => {
        expect(() => createSub(str)).toThrow("sub is required");
      });
    });

    it("nullish値ではエラーをスローする", () => {
      expect(() => createSub(null as unknown as string)).toThrow(
        "sub is required"
      );
      expect(() => createSub(undefined as unknown as string)).toThrow(
        "sub is required"
      );
    });
  });
});
