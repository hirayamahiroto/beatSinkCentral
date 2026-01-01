import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createUser } from "./index";
import * as SubModule from "../valueObjects/sub";
import * as EmailModule from "../valueObjects/email";
import * as NameModule from "../valueObjects/name";

describe("User Entity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("createUser", () => {
    it("有効なパラメータでUserを作成できる", () => {
      const user = createUser({
        accountId: "acc_123456789",
        sub: "auth0|123456789",
        email: "test@example.com",
        name: "testuser",
      });

      expect(user.accountId).toBe("acc_123456789");
      expect(user.sub).toBe("auth0|123456789");
      expect(user.email).toBe("test@example.com");
      expect(user.name).toBe("testuser");
      expect(user.createdAt).toStrictEqual(
        new Date("2024-01-01T00:00:00.000Z")
      );
      expect(user.updatedAt).toStrictEqual(
        new Date("2024-01-01T00:00:00.000Z")
      );
    });

    it("各値オブジェクトの生成関数が呼び出される", () => {
      const createSubSpy = vi.spyOn(SubModule, "createSub");
      const createEmailSpy = vi.spyOn(EmailModule, "createEmail");
      const createNameSpy = vi.spyOn(NameModule, "createName");

      createUser({
        accountId: "acc_123456789",
        sub: "auth0|123456789",
        email: "test@example.com",
        name: "testuser",
      });

      expect(createSubSpy).toHaveBeenCalledWith("auth0|123456789");
      expect(createEmailSpy).toHaveBeenCalledWith("test@example.com");
      expect(createNameSpy).toHaveBeenCalledWith("testuser");
    });
  });
});
