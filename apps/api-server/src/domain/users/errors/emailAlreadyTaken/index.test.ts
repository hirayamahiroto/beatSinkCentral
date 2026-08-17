import { describe, it, expect } from "vitest";
import {
  createEmailAlreadyTakenError,
  isEmailAlreadyTakenError,
} from "./index";

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

  it("生成したエラーを型ガードで判別できる", () => {
    expect(isEmailAlreadyTakenError(createEmailAlreadyTakenError())).toBe(true);
  });

  it("別のエラーや非 Error は判別しない", () => {
    expect(isEmailAlreadyTakenError(new Error("boom"))).toBe(false);
    expect(isEmailAlreadyTakenError({ type: "EmailAlreadyTakenError" })).toBe(
      false,
    );
    expect(isEmailAlreadyTakenError(null)).toBe(false);
  });
});
