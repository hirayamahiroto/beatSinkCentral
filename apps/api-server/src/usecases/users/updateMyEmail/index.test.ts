import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateMyEmail } from "./index";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import type {
  IUserReader,
  IUserWriter,
} from "../../../domain/users/repositories";
import type { WriteCapabilities } from "../../capabilities";

const user = reconstructUser({
  id: "550e8400-e29b-41d4-a716-446655440000",
  subId: "auth0|123456789",
  email: "old@example.com",
});

const artist = reconstructArtist({
  artistId: "artist-1",
  accountId: "old_handle",
  ownerUserId: user.getId(),
  profile: null,
});

const createCaps = () =>
  ({
    actor: { user, artist },
    users: {
      findBySub: vi.fn<IUserReader["findBySub"]>(async () => null),
      save: vi.fn<IUserWriter["save"]>(),
      updateEmail: vi.fn<IUserWriter["updateEmail"]>(),
    },
  }) satisfies Pick<WriteCapabilities, "actor" | "users">;

describe("updateMyEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Actor の email を更新し、新しい email を返す", async () => {
    const caps = createCaps();
    caps.users.updateEmail.mockResolvedValue(
      reconstructUser({
        id: user.getId(),
        subId: user.getSub(),
        email: "new@example.com",
      }),
    );

    const result = await updateMyEmail(caps, { email: "new@example.com" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toStrictEqual({
        userId: user.getId(),
        email: "new@example.com",
      });
    }
    expect(caps.users.updateEmail).toHaveBeenCalledWith({
      id: user.getId(),
      email: "new@example.com",
    });
  });

  it("email が不正な形式の場合は保存せず InvalidEmailFormatError を err で返す", async () => {
    const caps = createCaps();

    const result = await updateMyEmail(caps, { email: "invalid" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidEmailFormatError");
    }
    expect(caps.users.updateEmail).not.toHaveBeenCalled();
  });
});
