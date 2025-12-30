import { describe, it, expect } from "vitest";
import { createAuth0UserId } from "./index";

describe("Auth0UserId", () => {
  describe("createAuth0UserId", () => {
    it("有効なAuth0ユーザーIDでオブジェクトを作成できる", () => {
      const validIds = [
        "auth0|123456789",
        "google-oauth2|123456789",
        "github|123456789",
        "simple-id",
      ];

      validIds.forEach((id) => {
        const auth0UserId = createAuth0UserId(id);
        expect(auth0UserId.value).toBe(id);
      });
    });

    it("空文字列ではエラーをスローする", () => {
      expect(() => createAuth0UserId("")).toThrow("auth0UserId is required");
    });

    it("空白のみの文字列ではエラーをスローする", () => {
      const whitespaceStrings = ["   ", "\t", "\n", "  \t\n  "];

      whitespaceStrings.forEach((str) => {
        expect(() => createAuth0UserId(str)).toThrow("auth0UserId is required");
      });
    });

    it("nullish値ではエラーをスローする", () => {
      expect(() => createAuth0UserId(null as unknown as string)).toThrow(
        "auth0UserId is required"
      );
      expect(() => createAuth0UserId(undefined as unknown as string)).toThrow(
        "auth0UserId is required"
      );
    });
  });
});
