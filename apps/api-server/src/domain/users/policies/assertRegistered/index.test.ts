import { describe, it, expect } from "vitest";
import { assertRegistered, isUserNotFoundError } from "./index";
import { reconstructUser } from "../../factories";

describe("assertRegistered", () => {
  it("userが存在すれば何もスローしない", () => {
    const user = reconstructUser({
      id: "user-1",
      subId: "auth0|123",
      email: "test@example.com",
    });

    expect(() => assertRegistered(user)).not.toThrow();
  });

  it("userがnullの場合はUserNotFoundErrorをスローする", () => {
    expect(() => assertRegistered(null)).toThrowError();

    try {
      assertRegistered(null);
    } catch (error) {
      expect(isUserNotFoundError(error)).toBe(true);
    }
  });
});
