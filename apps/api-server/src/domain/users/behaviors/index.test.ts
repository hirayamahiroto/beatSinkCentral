import { describe, it, expect } from "vitest";
import { createUserBehaviors } from "./index";
import { createSub } from "../valueObjects/sub";
import { createEmail } from "../valueObjects/email";
import { unwrapOrThrow } from "../../../utils/result";

const subId = unwrapOrThrow(createSub("auth0|123"), "fixture invalid");
const email = unwrapOrThrow(createEmail("test@example.com"), "fixture invalid");
const state = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  subId,
  email,
};

const newEmail = unwrapOrThrow(
  createEmail("new@example.com"),
  "fixture invalid",
);

describe("createUserBehaviors", () => {
  it("getIdでidを返す", () => {
    expect(createUserBehaviors(state).getId()).toBe(state.id);
  });

  it("getSubでsubの値を返す", () => {
    expect(createUserBehaviors(state).getSub()).toBe("auth0|123");
  });

  it("getEmailでemailの値を返す", () => {
    expect(createUserBehaviors(state).getEmail()).toBe("test@example.com");
  });

  it("toPersistenceで永続化用オブジェクトを返す", () => {
    expect(createUserBehaviors(state).toPersistence()).toStrictEqual({
      id: state.id,
      subId: "auth0|123",
      email: "test@example.com",
    });
  });

  describe("changeEmail", () => {
    it("新しいemail VOを持つUserを返す", () => {
      const user = createUserBehaviors(state);
      const updated = user.changeEmail(newEmail);

      expect(updated.getEmail()).toBe("new@example.com");
      expect(updated.getId()).toBe(state.id);
      expect(updated.getSub()).toBe("auth0|123");
    });

    it("元のUserは不変", () => {
      const user = createUserBehaviors(state);
      user.changeEmail(newEmail);

      expect(user.getEmail()).toBe("test@example.com");
    });
  });
});
