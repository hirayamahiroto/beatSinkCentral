import { describe, it, expect } from "vitest";
import { reconstructUser } from "../factories";
import { createEmail, type Email } from "../valueObjects/email";
import { unwrapOrThrow } from "../../../utils/result";

const emailOf = (value: string): Email =>
  unwrapOrThrow(createEmail(value), "test setup: invalid email");

const id = "550e8400-e29b-41d4-a716-446655440000";

const user = reconstructUser({
  id,
  subId: "auth0|123",
  email: "test@example.com",
});

describe("createUserBehaviors", () => {
  it("getIdでidを返す", () => {
    expect(user.getId()).toBe(id);
  });

  it("getSubでsubの値を返す", () => {
    expect(user.getSub()).toBe("auth0|123");
  });

  it("getEmailでemailの値を返す", () => {
    expect(user.getEmail()).toBe("test@example.com");
  });

  it("toPersistenceで永続化用オブジェクトを返す", () => {
    expect(user.toPersistence()).toStrictEqual({
      id,
      subId: "auth0|123",
      email: "test@example.com",
    });
  });

  describe("changeEmail", () => {
    it("新しいemail VOを持つUserを返す", () => {
      const updated = user.changeEmail(emailOf("new@example.com"));

      expect(updated.getEmail()).toBe("new@example.com");
      expect(updated.getId()).toBe(id);
      expect(updated.getSub()).toBe("auth0|123");
    });

    it("元のUserは不変", () => {
      user.changeEmail(emailOf("new@example.com"));

      expect(user.getEmail()).toBe("test@example.com");
    });
  });
});
