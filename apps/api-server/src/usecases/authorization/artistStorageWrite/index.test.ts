import { describe, it, expect } from "vitest";
import { withArtistStorageWriteCapabilities } from "./index";
import {
  createCapabilityDepsStub,
  testUser as user,
  testArtist as artist,
} from "../testDoubles";
import { isUserNotFoundError } from "../../../domain/users/errors/userNotFound";
import { isArtistNotFoundError } from "../../../domain/artists/errors/artistNotFound";
import { ok } from "../../../utils/result";

describe("withArtistStorageWriteCapabilities", () => {
  it("未登録なら work を呼ばず UserNotFoundError を返す", async () => {
    const { deps } = createCapabilityDepsStub({ status: "unregistered" });
    let workCalls = 0;

    const result = await withArtistStorageWriteCapabilities(
      deps,
      "auth0|123",
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
  });

  it("Artist が未作成なら work を呼ばず ArtistNotFoundError を返す", async () => {
    const { deps } = createCapabilityDepsStub({ status: "userOnly", user });
    let workCalls = 0;

    const result = await withArtistStorageWriteCapabilities(
      deps,
      "auth0|123",
      async () => {
        workCalls += 1;
        return ok("called");
      },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isArtistNotFoundError(result.error)).toBe(true);
    }
    expect(workCalls).toBe(0);
  });

  it("Actor が揃っていればストレージ書き込み権能で work を実行する", async () => {
    const { deps } = createCapabilityDepsStub({
      status: "complete",
      actor: { user, artist },
    });

    const result = await withArtistStorageWriteCapabilities(
      deps,
      "auth0|123",
      async (caps) => ok(caps.actor.artist.getArtistId()),
    );

    expect(result).toStrictEqual(ok("artist-1"));
  });
});
