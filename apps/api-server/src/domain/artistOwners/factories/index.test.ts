import { describe, it, expect } from "vitest";
import { createArtistOwner, reconstructArtistOwner } from "./index";

describe("createArtistOwner", () => {
  it("userIdとartistIdを反映したArtistOwnerを生成する", () => {
    const owner = createArtistOwner({
      userId: "user-1",
      artistId: "artist-1",
    });
    const persisted = owner.toPersistence();

    expect(persisted.userId).toBe("user-1");
    expect(persisted.artistId).toBe("artist-1");
    expect(typeof persisted.id).toBe("string");
    expect(persisted.id.length).toBeGreaterThan(0);
  });

  it("生成のたびに異なるidが割り当てられる", () => {
    const a = createArtistOwner({ userId: "user-1", artistId: "artist-1" });
    const b = createArtistOwner({ userId: "user-1", artistId: "artist-1" });

    expect(a.toPersistence().id).not.toBe(b.toPersistence().id);
  });
});

describe("reconstructArtistOwner", () => {
  it("永続化データからArtistOwnerを復元する", () => {
    const params = {
      id: "owner-1",
      userId: "user-1",
      artistId: "artist-1",
    };

    const owner = reconstructArtistOwner(params);

    expect(owner.toPersistence()).toStrictEqual(params);
  });
});
