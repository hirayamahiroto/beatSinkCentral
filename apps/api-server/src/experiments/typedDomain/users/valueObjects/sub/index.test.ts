import { describe, it, expect } from "vitest";
import { createSub } from "./index";

describe("createSub", () => {
  it("空でなければ ok(Sub) を返す", () => {
    const result = createSub("auth0|123");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("auth0|123");
      expect(result.value._tag).toBe("Sub");
    }
  });

  it("空白のみなら throw せず err を返す", () => {
    const result = createSub("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidSubFormatError");
    }
  });
});
