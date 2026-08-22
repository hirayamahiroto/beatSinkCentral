import { describe, it, expect } from "vitest";
import { withUserWriteCapabilitiesById } from "./index";
import {
  createCapabilityDepsStub,
  testUser as user,
  testArtist as artist,
} from "../testDoubles";
import { isUserNotFoundError } from "../../../domain/users/errors/userNotFound";
import {
  createEmailAlreadyTakenError,
  isEmailAlreadyTakenError,
} from "../../../domain/users/errors/emailAlreadyTaken";
import { createAccountIdAlreadyTakenError } from "../../../domain/artists/errors/accountIdAlreadyTaken";
import { ok } from "../../../utils/result";

describe("withUserWriteCapabilitiesById", () => {
  it("未登録ならトランザクション境界を張らず UserNotFoundError を返す", async () => {
    const { deps, calls } = createCapabilityDepsStub({
      status: "unregistered",
    });
    let workCalls = 0;

    const result = await withUserWriteCapabilitiesById(
      deps,
      "auth0|123",
      "user-1",
      async () => {
        workCalls += 1;
        return ok("called");
      },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isUserNotFoundError(result.error)).toBe(true);
    }
    expect(workCalls).toBe(0);
    expect(calls.userWriteBoundaries).toBe(0);
  });

  it("パスの userId が本人と一致しなければ境界を張らず UserNotFoundError を返す（存在を秘匿）", async () => {
    const { deps, calls } = createCapabilityDepsStub({
      status: "userOnly",
      user,
    });

    const result = await withUserWriteCapabilitiesById(
      deps,
      "auth0|123",
      "other-user",
      async () => ok("called"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isUserNotFoundError(result.error)).toBe(true);
    }
    expect(calls.userWriteBoundaries).toBe(0);
  });

  it("Artist が未作成でも userId が一致すれば user 権能で work を実行する", async () => {
    const { deps, calls } = createCapabilityDepsStub({
      status: "userOnly",
      user,
    });

    const result = await withUserWriteCapabilitiesById(
      deps,
      "auth0|123",
      "user-1",
      async (caps) => ok(caps.user.getId()),
    );

    expect(result).toStrictEqual(ok("user-1"));
    expect(calls.userWriteBoundaries).toBe(1);
  });

  it("Actor が揃っている場合も user 権能で work を実行する", async () => {
    const { deps, calls } = createCapabilityDepsStub({
      status: "complete",
      actor: { user, artist },
    });

    const result = await withUserWriteCapabilitiesById(
      deps,
      "auth0|123",
      "user-1",
      async (caps) => ok(caps.user.getId()),
    );

    expect(result).toStrictEqual(ok("user-1"));
    expect(calls.userWriteBoundaries).toBe(1);
  });

  it("email の一意制約違反は EmailAlreadyTakenError の err に変換する", async () => {
    const { deps } = createCapabilityDepsStub({ status: "userOnly", user });

    const result = await withUserWriteCapabilitiesById(
      deps,
      "auth0|123",
      "user-1",
      async () => {
        throw createEmailAlreadyTakenError();
      },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isEmailAlreadyTakenError(result.error)).toBe(true);
    }
  });

  it("この権能では書けない accountId の衝突は変換せず伝播する", async () => {
    const { deps } = createCapabilityDepsStub({ status: "userOnly", user });
    const accountIdConflict = createAccountIdAlreadyTakenError("taken");

    await expect(
      withUserWriteCapabilitiesById(deps, "auth0|123", "user-1", async () => {
        throw accountIdConflict;
      }),
    ).rejects.toBe(accountIdConflict);
  });

  it("一意制約違反以外の例外はそのまま伝播する", async () => {
    const { deps } = createCapabilityDepsStub({ status: "userOnly", user });
    const connectionError = new Error("connection terminated");

    await expect(
      withUserWriteCapabilitiesById(deps, "auth0|123", "user-1", async () => {
        throw connectionError;
      }),
    ).rejects.toBe(connectionError);
  });
});
