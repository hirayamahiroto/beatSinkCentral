import { describe, it, expect } from "vitest";
import { withRegistrationCapabilities } from "./index";
import { createCapabilityDepsStub } from "../testDoubles";
import {
  createHandleAlreadyTakenError,
  isHandleAlreadyTakenError,
} from "../../../domain/artists/errors/handleAlreadyTaken";
import {
  createEmailAlreadyTakenError,
  isEmailAlreadyTakenError,
} from "../../../domain/users/errors/emailAlreadyTaken";
import { ok } from "../../../utils/result";

describe("withRegistrationCapabilities", () => {
  it("Actor を要求せず登録権能で work を実行する", async () => {
    const { deps, calls } = createCapabilityDepsStub({
      status: "unregistered",
    });

    const result = await withRegistrationCapabilities(deps, async () =>
      ok("registered"),
    );

    expect(result).toStrictEqual(ok("registered"));
    expect(calls.registrationBoundaries).toBe(1);
    expect(calls.resolvedSubIds).toEqual([]);
  });

  it("handle の衝突は HandleAlreadyTakenError の err に変換する", async () => {
    const { deps } = createCapabilityDepsStub({ status: "unregistered" });

    const result = await withRegistrationCapabilities(deps, async () => {
      throw createHandleAlreadyTakenError("test_account");
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isHandleAlreadyTakenError(result.error)).toBe(true);
      if (isHandleAlreadyTakenError(result.error)) {
        expect(result.error.handle).toBe("test_account");
      }
    }
  });

  it("email の衝突は EmailAlreadyTakenError の err に変換する", async () => {
    const { deps } = createCapabilityDepsStub({ status: "unregistered" });

    const result = await withRegistrationCapabilities(deps, async () => {
      throw createEmailAlreadyTakenError();
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isEmailAlreadyTakenError(result.error)).toBe(true);
    }
  });

  it("一意制約違反以外の例外はそのまま伝播する", async () => {
    const { deps } = createCapabilityDepsStub({ status: "unregistered" });
    const connectionError = new Error("connection terminated");

    await expect(
      withRegistrationCapabilities(deps, async () => {
        throw connectionError;
      }),
    ).rejects.toBe(connectionError);
  });
});
