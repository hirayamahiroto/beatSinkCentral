import { describe, it, expect } from "vitest";
import {
  createAccountIdAlreadyTakenError,
  isAccountIdAlreadyTakenError,
} from "./index";

describe("AccountIdAlreadyTakenError", () => {
  it("type に AccountIdAlreadyTakenError を持つ Error を生成する", () => {
    const error = createAccountIdAlreadyTakenError("taken_id");

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("AccountIdAlreadyTakenError");
  });

  it("衝突した accountId を保持する", () => {
    expect(createAccountIdAlreadyTakenError("taken_id").accountId).toBe(
      "taken_id",
    );
  });

  it("生成したエラーを型ガードで判別できる", () => {
    expect(
      isAccountIdAlreadyTakenError(
        createAccountIdAlreadyTakenError("taken_id"),
      ),
    ).toBe(true);
  });

  it("別のエラーや非 Error は判別しない", () => {
    expect(isAccountIdAlreadyTakenError(new Error("boom"))).toBe(false);
    expect(
      isAccountIdAlreadyTakenError({
        type: "AccountIdAlreadyTakenError",
        accountId: "taken_id",
      }),
    ).toBe(false);
    expect(isAccountIdAlreadyTakenError(null)).toBe(false);
  });
});
