import { describe, it, expect, vi } from "vitest";
import { resolveActorState, type ActorStateReaders } from "./index";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";

const user = reconstructUser({
  id: "user-1",
  subId: "auth0|123",
  email: "test@example.com",
});

const artist = reconstructArtist({
  artistId: "artist-1",
  handle: "user_123",
  ownerUserId: "user-1",
  profile: null,
});

const createReaders = (): ActorStateReaders => ({
  users: { findBySub: vi.fn(async () => null) },
  artists: {
    findByUserId: vi.fn(async () => null),
    findByHandle: vi.fn(async () => null),
    findByHandles: vi.fn(async () => []),
  },
});

describe("resolveActorState", () => {
  it("User が見つからなければ unregistered を返す", async () => {
    const readers = createReaders();

    const resolution = await resolveActorState(readers, "auth0|unknown");

    expect(resolution).toStrictEqual({ status: "unregistered" });
    expect(readers.users.findBySub).toHaveBeenCalledWith("auth0|unknown");
    expect(readers.artists.findByUserId).not.toHaveBeenCalled();
  });

  it("Artist が見つからなければ userOnly を返す", async () => {
    const readers = createReaders();
    vi.mocked(readers.users.findBySub).mockResolvedValue(user);

    const resolution = await resolveActorState(readers, "auth0|123");

    expect(resolution).toStrictEqual({ status: "userOnly", user });
    expect(readers.artists.findByUserId).toHaveBeenCalledWith("user-1");
  });

  it("User と Artist が揃っていれば complete を返す", async () => {
    const readers = createReaders();
    vi.mocked(readers.users.findBySub).mockResolvedValue(user);
    vi.mocked(readers.artists.findByUserId).mockResolvedValue(artist);

    const resolution = await resolveActorState(readers, "auth0|123");

    expect(resolution).toStrictEqual({
      status: "complete",
      actor: { user, artist },
    });
  });
});
