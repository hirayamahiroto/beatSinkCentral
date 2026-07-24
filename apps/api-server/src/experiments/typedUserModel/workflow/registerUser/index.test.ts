import { describe, it, expect } from "vitest";
import { registerUser } from "./index";
import type { RegisteredUser } from "../../user";
import { createSub } from "../../valueObjects/sub";
import { createEmail } from "../../valueObjects/email";

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

describe("registerUser workflow", () => {
  it("新規かつ入力が正当なら RegisteredUser を返す", () => {
    const result = registerUser(
      { sub: "auth0|new", email: "new@example.com" },
      null,
      "new-id",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("registered");
      expect(result.value.id).toBe("new-id");
      expect(result.value.sub.value).toBe("auth0|new");
      expect(result.value.email.value).toBe("new@example.com");
    }
  });

  it("既に登録済みなら UserAlreadyRegisteredError で短絡する", () => {
    const result = registerUser(
      { sub: "auth0|new", email: "new@example.com" },
      buildRegisteredUser(),
      "new-id",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("UserAlreadyRegisteredError");
    }
  });

  it("email が不正なら InvalidEmailFormatError を型付きで返す", () => {
    const result = registerUser(
      { sub: "auth0|new", email: "invalid" },
      null,
      "new-id",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidEmailFormatError");
    }
  });

  it("sub が空なら InvalidSubFormatError を型付きで返す", () => {
    const result = registerUser(
      { sub: "  ", email: "new@example.com" },
      null,
      "new-id",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidSubFormatError");
    }
  });
});
