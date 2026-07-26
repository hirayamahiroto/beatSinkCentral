import { describe, it, expect } from "vitest";
import { assertNotRegistered } from "./index";
import { createSub } from "../valueObjects/sub";
import { createEmail } from "../valueObjects/email";
import type { RegisteredUser } from "../user";

const buildRegisteredUser = (): RegisteredUser => {
  const sub = createSub("auth0|existing");
  const email = createEmail("existing@example.com");
  if (!sub.ok || !email.ok) throw new Error("fixture invalid");
  return {
    status: "registered",
    id: "existing-id",
    sub: sub.value,
    email: email.value,
  };
};

describe("assertNotRegistered", () => {
  it("未登録(null)なら ok", () => {
    expect(assertNotRegistered(null).ok).toBe(true);
  });

  it("登録済みなら UserAlreadyRegisteredError を返す", () => {
    const result = assertNotRegistered(buildRegisteredUser());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("UserAlreadyRegisteredError");
    }
  });
});
