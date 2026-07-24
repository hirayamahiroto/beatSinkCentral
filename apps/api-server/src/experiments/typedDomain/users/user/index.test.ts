import { describe, it, expect } from "vitest";
import type { RegisteredUser, UnregisteredUser, User } from "./index";
import { createSub } from "../valueObjects/sub";
import { createEmail } from "../valueObjects/email";

describe("User (状態を判別可能ユニオンで表現)", () => {
  it("registered だけが registeredAt 相当の id を型で持つ", () => {
    const sub = createSub("auth0|123");
    const email = createEmail("test@example.com");
    if (!sub.ok || !email.ok) throw new Error("fixture invalid");

    const unregistered: UnregisteredUser = {
      status: "unregistered",
      sub: sub.value,
      email: email.value,
    };
    const registered: RegisteredUser = {
      status: "registered",
      id: "user-1",
      sub: sub.value,
      email: email.value,
    };

    const readId = (user: User): string | null =>
      user.status === "registered" ? user.id : null;

    expect(readId(unregistered)).toBeNull();
    expect(readId(registered)).toBe("user-1");

    // @ts-expect-error unregistered は id を型として持たない
    void unregistered.id;
  });
});
