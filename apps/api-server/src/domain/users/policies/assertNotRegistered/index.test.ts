import { describe, it, expect } from "vitest";
import { assertNotRegistered, isUserAlreadyRegisteredError } from "./index";
import { reconstructUser } from "../../factories";

describe("assertNotRegistered", () => {
  it("existingUserがnullなら何もスローしない", () => {
    expect(() => assertNotRegistered(null)).not.toThrow();
  });

  it("existingUserが存在する場合はUserAlreadyRegisteredErrorをスローする", () => {
    const existing = reconstructUser({
      id: "user-1",
      subId: "auth0|123",
      email: "test@example.com",
    });

    expect(() => assertNotRegistered(existing)).toThrowError();

    try {
      assertNotRegistered(existing);
    } catch (error) {
      expect(isUserAlreadyRegisteredError(error)).toBe(true);
    }
  });
});
