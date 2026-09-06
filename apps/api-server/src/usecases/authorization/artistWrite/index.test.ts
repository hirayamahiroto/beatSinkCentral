import { describe, it, expect } from "vitest";
import { withArtistWriteCapabilitiesById } from "./index";
import {
  createCapabilityDepsStub,
  testUser as user,
  testArtist as artist,
} from "../testDoubles";
import { isUserNotFoundError } from "../../../domain/users/errors/userNotFound";
import { isArtistNotFoundError } from "../../../domain/artists/errors/artistNotFound";
import {
  createHandleAlreadyTakenError,
  isHandleAlreadyTakenError,
} from "../../../domain/artists/errors/handleAlreadyTaken";
import {
  createEmailAlreadyTakenError,
  isEmailAlreadyTakenError,
} from "../../../domain/users/errors/emailAlreadyTaken";
import { ok } from "../../../utils/result";

describe("withArtistWriteCapabilitiesById", () => {
  it("未登録ならトランザクション境界を張らず UserNotFoundError を返す", async () => {
    const { deps, calls } = createCapabilityDepsStub({
      status: "unregistered",
    });

    const result = await withArtistWriteCapabilitiesById(
      deps,
      "auth0|123",
      "artist-1",
      async () => ok("called"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isUserNotFoundError(result.error)).toBe(true);
    }
    expect(calls.artistWriteBoundaries).toBe(0);
  });

  it("Artist が未作成ならトランザクション境界を張らず ArtistNotFoundError を返す", async () => {
    const { deps, calls } = createCapabilityDepsStub({
      status: "userOnly",
      user,
    });

    const result = await withArtistWriteCapabilitiesById(
      deps,
      "auth0|123",
      "artist-1",
      async () => ok("called"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isArtistNotFoundError(result.error)).toBe(true);
    }
    expect(calls.artistWriteBoundaries).toBe(0);
  });

  it("パスの artistId が Actor と一致すれば書き込み境界に委譲する", async () => {
    const { deps, calls } = createCapabilityDepsStub({
      status: "complete",
      actor: { user, artist },
    });

    const result = await withArtistWriteCapabilitiesById(
      deps,
      "auth0|123",
      "artist-1",
      async (caps) => ok(caps.actor.user.getId()),
    );

    expect(result).toStrictEqual(ok("user-1"));
    expect(calls.artistWriteBoundaries).toBe(1);
  });

  it("パスの artistId が一致しなければ境界を張らず ArtistNotFoundError を返す", async () => {
    const { deps, calls } = createCapabilityDepsStub({
      status: "complete",
      actor: { user, artist },
    });

    const result = await withArtistWriteCapabilitiesById(
      deps,
      "auth0|123",
      "other-artist",
      async () => ok("called"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isArtistNotFoundError(result.error)).toBe(true);
    }
    expect(calls.artistWriteBoundaries).toBe(0);
  });

  it("handle の一意制約違反は HandleAlreadyTakenError の err に変換する", async () => {
    const { deps } = createCapabilityDepsStub({
      status: "complete",
      actor: { user, artist },
    });

    const result = await withArtistWriteCapabilitiesById(
      deps,
      "auth0|123",
      "artist-1",
      async () => {
        throw createHandleAlreadyTakenError("new_handle");
      },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isHandleAlreadyTakenError(result.error)).toBe(true);
      if (isHandleAlreadyTakenError(result.error)) {
        expect(result.error.handle).toBe("new_handle");
      }
    }
  });

  it("email の一意制約違反も EmailAlreadyTakenError の err に変換する", async () => {
    const { deps } = createCapabilityDepsStub({
      status: "complete",
      actor: { user, artist },
    });

    const result = await withArtistWriteCapabilitiesById(
      deps,
      "auth0|123",
      "artist-1",
      async () => {
        throw createEmailAlreadyTakenError();
      },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isEmailAlreadyTakenError(result.error)).toBe(true);
    }
  });

  it("一意制約違反以外の例外はそのまま伝播する", async () => {
    const { deps } = createCapabilityDepsStub({
      status: "complete",
      actor: { user, artist },
    });
    const connectionError = new Error("connection terminated");

    await expect(
      withArtistWriteCapabilitiesById(
        deps,
        "auth0|123",
        "artist-1",
        async () => {
          throw connectionError;
        },
      ),
    ).rejects.toBe(connectionError);
  });
});
