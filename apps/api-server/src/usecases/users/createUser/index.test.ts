import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUser, type CreateUserInput } from "./index";
import { isUserAlreadyRegisteredError } from "../../../domain/users/errors/userAlreadyRegistered";
import {
  createHandleAlreadyTakenError,
  isHandleAlreadyTakenError,
} from "../../../domain/artists/errors/handleAlreadyTaken";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import type { RegistrationCapabilities } from "../../capabilities";
import type {
  IUserReader,
  IUserWriter,
} from "../../../domain/users/repositories";
import type {
  IArtistReader,
  IArtistWriter,
} from "../../../domain/artists/repositories";

const createCaps = () =>
  ({
    users: {
      findBySub: vi.fn<IUserReader["findBySub"]>(async () => null),
      save: vi.fn<IUserWriter["save"]>(),
      updateEmail: vi.fn<IUserWriter["updateEmail"]>(),
    },
    artists: {
      findByUserId: vi.fn<IArtistReader["findByUserId"]>(async () => null),
      findByHandle: vi.fn<IArtistReader["findByHandle"]>(async () => null),
      save: vi.fn<IArtistWriter["save"]>(),
      updateHandle: vi.fn<IArtistWriter["updateHandle"]>(),
    },
  }) satisfies RegistrationCapabilities;

const validInput = {
  subId: "auth0|123456789",
  email: "test@example.com",
  handle: "test_account",
} satisfies CreateUserInput;

describe("createUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("新規ユーザーを作成してuserIdとartistIdを返す", async () => {
    const caps = createCaps();

    const result = await createUser(caps, validInput);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.value.userId).toBe("string");
      expect(typeof result.value.artistId).toBe("string");
    }
    expect(caps.users.save).toHaveBeenCalledTimes(1);
    expect(caps.artists.save).toHaveBeenCalledTimes(1);
  });

  it("既存ユーザーの場合はUserAlreadyRegisteredErrorをerrで返す", async () => {
    const caps = createCaps();
    caps.users.findBySub.mockResolvedValue(
      reconstructUser({
        id: "existing-user-id",
        subId: validInput.subId,
        email: validInput.email,
      }),
    );

    const result = await createUser(caps, validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isUserAlreadyRegisteredError(result.error)).toBe(true);
    }
    expect(caps.users.save).not.toHaveBeenCalled();
    expect(caps.artists.save).not.toHaveBeenCalled();
  });

  it("Handleが既に取られている場合はHandleAlreadyTakenErrorをerrで返す", async () => {
    const caps = createCaps();
    caps.artists.findByHandle.mockResolvedValue(
      reconstructArtist({
        artistId: "existing-artist-id",
        handle: validInput.handle,
        ownerUserId: "other-user-id",
        profile: null,
      }),
    );

    const result = await createUser(caps, validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isHandleAlreadyTakenError(result.error)).toBe(true);
    }
    expect(caps.users.save).not.toHaveBeenCalled();
    expect(caps.artists.save).not.toHaveBeenCalled();
  });

  it("emailが不正な場合は保存せずInvalidEmailFormatErrorをerrで返す", async () => {
    const caps = createCaps();

    const result = await createUser(caps, { ...validInput, email: "invalid" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidEmailFormatError");
    }
    expect(caps.users.save).not.toHaveBeenCalled();
    expect(caps.artists.save).not.toHaveBeenCalled();
  });

  it("保存時の一意制約違反はそのまま伝播する", async () => {
    const caps = createCaps();
    const takenError = createHandleAlreadyTakenError(validInput.handle);
    caps.artists.save.mockRejectedValue(takenError);

    await expect(createUser(caps, validInput)).rejects.toBe(takenError);
  });

  it("重複確認は権能から受け取った executor で行い、引数でトランザクションを渡さない", async () => {
    const caps = createCaps();

    await createUser(caps, validInput);

    expect(caps.users.findBySub).toHaveBeenCalledWith(validInput.subId);
    expect(caps.artists.findByHandle).toHaveBeenCalledWith(validInput.handle);
  });
});
