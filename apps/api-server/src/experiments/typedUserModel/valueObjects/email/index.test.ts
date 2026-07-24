import { describe, it, expect } from "vitest";
import { createEmail, type Email } from "./index";
import { createSub } from "../sub";

describe("createEmail", () => {
  it("正当な形式なら ok(Email) を返す", () => {
    const result = createEmail(" test@example.com ");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("test@example.com");
      expect(result.value._tag).toBe("Email");
    }
  });

  it("不正な形式なら throw せず err を返す", () => {
    const result = createEmail("invalid-email");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidEmailFormatError");
    }
  });

  it("Sub は Email に代入できない（コンパイル時にブランドで弾く）", () => {
    const subResult = createSub("auth0|123");
    if (subResult.ok) {
      // @ts-expect-error Sub と Email は _tag が異なるため代入不可
      const _email: Email = subResult.value;
      void _email;
    }
  });
});
