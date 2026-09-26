import { describe, it, expect } from "vitest";
import {
  type AlreadyTakenError,
  anyAlreadyTaken,
  catchAlreadyTaken,
  raiseAlreadyTaken,
} from "./index";
import {
  createHandleAlreadyTakenError,
  type HandleAlreadyTakenError,
} from "../../domain/artists/errors/handleAlreadyTaken";
import { createEmailAlreadyTakenError } from "../../domain/users/errors/emailAlreadyTaken";
import { ok } from "../../utils/result";

const handleOnly = (
  conflict: AlreadyTakenError,
): HandleAlreadyTakenError | null =>
  conflict.type === "HandleAlreadyTakenError" ? conflict : null;

describe("catchAlreadyTaken", () => {
  it("成功時は結果をそのまま返す", async () => {
    const result = await catchAlreadyTaken(anyAlreadyTaken, async () =>
      ok("done"),
    );

    expect(result).toStrictEqual(ok("done"));
  });

  it("raise した衝突を同じインスタンスの err に変換する", async () => {
    const conflict = createEmailAlreadyTakenError();

    const result = await catchAlreadyTaken(anyAlreadyTaken, () =>
      raiseAlreadyTaken(conflict),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(conflict);
    }
  });

  it("select が対象外とした衝突は変換せず伝播する", async () => {
    const emailConflict = createEmailAlreadyTakenError();

    await expect(
      catchAlreadyTaken(handleOnly, () => raiseAlreadyTaken(emailConflict)),
    ).rejects.toBe(emailConflict);
  });

  it("raise を経ずに throw された衝突は変換せず伝播する", async () => {
    const handleConflict = createHandleAlreadyTakenError("taken");

    await expect(
      catchAlreadyTaken(anyAlreadyTaken, () => {
        throw handleConflict;
      }),
    ).rejects.toBe(handleConflict);
  });

  it("衝突以外の例外はそのまま伝播する", async () => {
    const connectionError = new Error("connection terminated");

    await expect(
      catchAlreadyTaken(anyAlreadyTaken, () => {
        throw connectionError;
      }),
    ).rejects.toBe(connectionError);
  });
});
