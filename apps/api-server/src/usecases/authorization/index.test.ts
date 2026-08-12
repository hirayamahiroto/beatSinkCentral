import { describe, it, expect } from "vitest";
import {
  toActor,
  withIdentityCapabilities,
  withReadCapabilities,
  withRegistrationCapabilities,
  withWriteCapabilities,
} from "./index";
import type {
  ActorResolution,
  CapabilityDeps,
  RegistrationCapabilities,
} from "../capabilities";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
} from "../../domain/artistProfiles/repositories";
import { isUserNotFoundError } from "../../domain/users/errors/userNotFound";
import { isArtistNotFoundError } from "../../domain/artists/errors/artistNotFound";
import {
  createAccountIdAlreadyTakenError,
  isAccountIdAlreadyTakenError,
} from "../../domain/artists/errors/accountIdAlreadyTaken";
import { reconstructUser } from "../../domain/users/factories";
import { reconstructArtist } from "../../domain/artists/factories";
import { ok } from "../../utils/result";

const user = reconstructUser({
  id: "user-1",
  subId: "auth0|123",
  email: "test@example.com",
});

const artist = reconstructArtist({
  artistId: "artist-1",
  accountId: "user_123",
  ownerUserId: "user-1",
  profile: null,
});

const unusedInAuthorizationTests = () => {
  throw new Error("authorization のテストでは呼ばれない");
};

const createArtistProfileReaderStub = (): IArtistProfileReader => ({
  findByArtistId: async () => null,
  findPublishedByAccountId: async () => null,
  listPublishedSummaries: async () => [],
});

const createArtistProfileWriterStub = (): IArtistProfileWriter => ({
  upsert: unusedInAuthorizationTests,
  setPublished: unusedInAuthorizationTests,
});

const createRegistrationCapabilitiesStub = (): RegistrationCapabilities => ({
  users: {
    findBySub: async () => null,
    save: unusedInAuthorizationTests,
    updateEmail: unusedInAuthorizationTests,
  },
  artists: {
    findByUserId: async () => null,
    findByAccountId: async () => null,
    save: unusedInAuthorizationTests,
    updateAccountId: unusedInAuthorizationTests,
  },
});

const createDeps = (resolution: ActorResolution) => {
  const calls: {
    resolvedSubIds: string[];
    writeBoundaries: number;
    registrationBoundaries: number;
  } = {
    resolvedSubIds: [],
    writeBoundaries: 0,
    registrationBoundaries: 0,
  };

  const deps: CapabilityDeps = {
    async resolveActorState(subId) {
      calls.resolvedSubIds.push(subId);
      return resolution;
    },

    buildPublicReadCapabilities: () => ({
      artistProfiles: createArtistProfileReaderStub(),
      linkTypes: { findAll: async () => [] },
    }),

    buildReadCapabilities: (actor) => ({
      actor,
      artistProfiles: createArtistProfileReaderStub(),
    }),

    async runWithWriteCapabilities(actor, work) {
      calls.writeBoundaries += 1;
      return work({
        actor,
        ...createRegistrationCapabilitiesStub(),
        artistProfiles: {
          ...createArtistProfileReaderStub(),
          ...createArtistProfileWriterStub(),
        },
      });
    },

    async runWithRegistrationCapabilities(work) {
      calls.registrationBoundaries += 1;
      return work(createRegistrationCapabilitiesStub());
    },
  };

  return { deps, calls };
};

describe("toActor", () => {
  it("未登録は UserNotFoundError に畳み込む", () => {
    const result = toActor({ status: "unregistered" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isUserNotFoundError(result.error)).toBe(true);
    }
  });

  it("user のみは ArtistNotFoundError に畳み込む", () => {
    const result = toActor({ status: "userOnly", user });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isArtistNotFoundError(result.error)).toBe(true);
    }
  });

  it("Actor が揃っていれば ok で返す", () => {
    const result = toActor({ status: "complete", actor: { user, artist } });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.user.getId()).toBe("user-1");
      expect(result.value.artist.getArtistId()).toBe("artist-1");
    }
  });
});

describe("withIdentityCapabilities", () => {
  it("Actor が解決できなくても解決状態をそのまま渡す", async () => {
    const { deps, calls } = createDeps({ status: "unregistered" });

    const received = await withIdentityCapabilities(
      deps,
      "auth0|unknown",
      async (caps) => caps.actorResolution,
    );

    expect(received).toStrictEqual({ status: "unregistered" });
    expect(calls.resolvedSubIds).toEqual(["auth0|unknown"]);
  });
});

describe("withReadCapabilities", () => {
  it("Actor が解決できなければ work を呼ばず err を返す", async () => {
    const { deps } = createDeps({ status: "userOnly", user });
    let workCalls = 0;

    const result = await withReadCapabilities(deps, "auth0|123", async () => {
      workCalls += 1;
      return ok("called");
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isArtistNotFoundError(result.error)).toBe(true);
    }
    expect(workCalls).toBe(0);
  });

  it("Actor が揃っていれば読み取り権能で work を実行する", async () => {
    const { deps } = createDeps({
      status: "complete",
      actor: { user, artist },
    });

    const result = await withReadCapabilities(deps, "auth0|123", async (caps) =>
      ok(caps.actor.artist.getArtistId()),
    );

    expect(result).toStrictEqual(ok("artist-1"));
  });
});

describe("withWriteCapabilities", () => {
  it("Actor が解決できなければトランザクション境界を張らない", async () => {
    const { deps, calls } = createDeps({ status: "unregistered" });

    const result = await withWriteCapabilities(deps, "auth0|123", async () =>
      ok("called"),
    );

    expect(result.ok).toBe(false);
    expect(calls.writeBoundaries).toBe(0);
  });

  it("Actor が揃っていれば書き込み境界に委譲する", async () => {
    const { deps, calls } = createDeps({
      status: "complete",
      actor: { user, artist },
    });

    const result = await withWriteCapabilities(
      deps,
      "auth0|123",
      async (caps) => ok(caps.actor.user.getId()),
    );

    expect(result).toStrictEqual(ok("user-1"));
    expect(calls.writeBoundaries).toBe(1);
  });

  it("並行更新による一意制約違反は AccountIdAlreadyTakenError の err に変換する", async () => {
    const { deps } = createDeps({
      status: "complete",
      actor: { user, artist },
    });

    const result = await withWriteCapabilities(deps, "auth0|123", async () => {
      throw createAccountIdAlreadyTakenError("new_handle");
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isAccountIdAlreadyTakenError(result.error)).toBe(true);
    }
  });

  it("一意制約違反以外の例外はそのまま伝播する", async () => {
    const { deps } = createDeps({
      status: "complete",
      actor: { user, artist },
    });
    const connectionError = new Error("connection terminated");

    await expect(
      withWriteCapabilities(deps, "auth0|123", async () => {
        throw connectionError;
      }),
    ).rejects.toBe(connectionError);
  });
});

describe("withRegistrationCapabilities", () => {
  it("Actor を要求せず登録権能で work を実行する", async () => {
    const { deps, calls } = createDeps({ status: "unregistered" });

    const result = await withRegistrationCapabilities(deps, async () =>
      ok("registered"),
    );

    expect(result).toStrictEqual(ok("registered"));
    expect(calls.registrationBoundaries).toBe(1);
    expect(calls.resolvedSubIds).toEqual([]);
  });

  it("並行登録による一意制約違反は AccountIdAlreadyTakenError の err に変換する", async () => {
    const { deps } = createDeps({ status: "unregistered" });

    const result = await withRegistrationCapabilities(deps, async () => {
      throw createAccountIdAlreadyTakenError("test_account");
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isAccountIdAlreadyTakenError(result.error)).toBe(true);
    }
  });

  it("一意制約違反以外の例外はそのまま伝播する", async () => {
    const { deps } = createDeps({ status: "unregistered" });
    const connectionError = new Error("connection terminated");

    await expect(
      withRegistrationCapabilities(deps, async () => {
        throw connectionError;
      }),
    ).rejects.toBe(connectionError);
  });
});
