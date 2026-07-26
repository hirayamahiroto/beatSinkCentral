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
        const result = createSub(id);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.value).toBe(id);
        }
      });
    });

    it("空文字列では err を返す", () => {
      const result = createSub("");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("InvalidSubFormatError");
      }
    });

    it("空白のみの文字列では err を返す", () => {
      const whitespaceStrings = ["   ", "\t", "\n", "  \t\n  "];

      whitespaceStrings.forEach((str) => {
        expect(createSub(str).ok).toBe(false);
      });
    });

    it("nullish値では err を返す", () => {
      expect(createSub(null as unknown as string).ok).toBe(false);
      expect(createSub(undefined as unknown as string).ok).toBe(false);
    });
  });
});
