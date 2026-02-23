import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createUser } from "./index";
import * as SubModule from "../valueObjects/sub";
import * as EmailModule from "../valueObjects/email";

describe("User Factory", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("createUser", () => {
    it("有効なパラメータでUserを作成し、toJSONで正しい値を返す", () => {
      const user = createUser({
        subId: "auth0|123456789",
        email: "test@example.com",
      });

      expect(user.toJSON()).toStrictEqual({
        subId: "auth0|123456789",
        email: "test@example.com",
      });
    });

    it("各値オブジェクトの生成関数が呼び出される", () => {
      const createSubSpy = vi.spyOn(SubModule, "createSub");
      const createEmailSpy = vi.spyOn(EmailModule, "createEmail");

      createUser({
        subId: "auth0|123456789",
        email: "test@example.com",
      });

      expect(createSubSpy).toHaveBeenCalledWith("auth0|123456789");
      expect(createEmailSpy).toHaveBeenCalledWith("test@example.com");
    });

    it("無効なemailでエラーをスローする", () => {
      expect(() =>
        createUser({
          subId: "auth0|123456789",
          email: "invalid-email",
        })
      ).toThrow();
    });
  });
});
