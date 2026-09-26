import { describe, it, expect } from "vitest";
import { createEmailAlreadyTakenError } from "./index";

describe("EmailAlreadyTakenError", () => {
  it("type に EmailAlreadyTakenError を持つ Error を生成する", () => {
    const error = createEmailAlreadyTakenError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("EmailAlreadyTakenError");
  });

  it("email を保持しない（メッセージ・ログ経由の PII 露出を避ける）", () => {
    const error = createEmailAlreadyTakenError();

    expect(Object.keys(error)).toStrictEqual(["type"]);
    expect(error.message).toBe("EmailAlreadyTakenError");
  });
});
