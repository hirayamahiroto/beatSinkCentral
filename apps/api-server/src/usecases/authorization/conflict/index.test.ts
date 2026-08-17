import { describe, it, expect } from "vitest";
import { catchAlreadyTaken, isAlreadyTakenError } from "./index";
import {
  createAccountIdAlreadyTakenError,
  isAccountIdAlreadyTakenError,
} from "../../../domain/artists/errors/accountIdAlreadyTaken";
import {
  createEmailAlreadyTakenError,
  isEmailAlreadyTakenError,
} from "../../../domain/users/errors/emailAlreadyTaken";
import { ok } from "../../../utils/result";

describe("isAlreadyTakenError", () => {
  it("accountId / email の衝突を判別する", () => {
    expect(isAlreadyTakenError(createAccountIdAlreadyTakenError("taken"))).toBe(
      true,
    );
    expect(isAlreadyTakenError(createEmailAlreadyTakenError())).toBe(true);
  });

  it("それ以外のエラーは判別しない", () => {
    expect(isAlreadyTakenError(new Error("connection terminated"))).toBe(false);
  });
});

describe("catchAlreadyTaken", () => {
  it("成功時は結果をそのまま返す", async () => {
    const result = await catchAlreadyTaken(isAlreadyTakenError, async () =>
      ok("done"),
    );

    expect(result).toStrictEqual(ok("done"));
  });

  it("判別対象の例外を err に変換する", async () => {
    const result = await catchAlreadyTaken(isEmailAlreadyTakenError, () => {
      throw createEmailAlreadyTakenError();
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isEmailAlreadyTakenError(result.error)).toBe(true);
    }
  });

  it("判別対象でない衝突は変換せず伝播する", async () => {
    const accountIdConflict = createAccountIdAlreadyTakenError("taken");

    await expect(
      catchAlreadyTaken(isEmailAlreadyTakenError, () => {
        throw accountIdConflict;
      }),
    ).rejects.toBe(accountIdConflict);
    expect(isAccountIdAlreadyTakenError(accountIdConflict)).toBe(true);
  });

  it("衝突以外の例外はそのまま伝播する", async () => {
    const connectionError = new Error("connection terminated");

    await expect(
      catchAlreadyTaken(isAlreadyTakenError, () => {
        throw connectionError;
      }),
    ).rejects.toBe(connectionError);
  });
});
