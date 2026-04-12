import { describe, it, expect } from "vitest";
import { createUserBehaviors } from "./index";
import { createSub } from "../valueObjects/sub";
import { createEmail } from "../valueObjects/email";

describe("createUserBehaviors", () => {
  const state = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    subId: createSub("auth0|123"),
    email: createEmail("test@example.com"),
  };

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
});
