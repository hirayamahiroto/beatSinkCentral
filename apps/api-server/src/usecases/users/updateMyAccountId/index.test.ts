import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateMyAccountIdUseCase,
  type UpdateMyAccountIdDeps,
  type UpdateMyAccountIdInput,
} from "./index";
import { isUserNotFoundError } from "../../../domain/users/policies/assertRegistered";
import { isArtistNotFoundError } from "../../../domain/artists/policies/assertArtistExists";
import { isAccountIdAlreadyTakenError } from "../../../domain/artists/policies/assertAccountIdAvailable";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";

const createMockDeps = () => {
  const deps = {
    userRepository: {
      save: vi.fn(),
      findBySub: vi.fn(),
      updateEmail: vi.fn(),
    },
    artistRepository: {
      save: vi.fn(),
      findByUserId: vi.fn(),
      findByAccountId: vi.fn(),
      updateAccountId: vi.fn(),
    },
    txRunner: {
      run: vi.fn(async (fn) => fn({} as Parameters<typeof fn>[0])),
    },
  } satisfies UpdateMyAccountIdDeps;
  return deps;
};

const validInput = {
  subId: "auth0|123456789",
  accountId: "new_handle",
} satisfies UpdateMyAccountIdInput;

const existingUser = reconstructUser({
  id: "550e8400-e29b-41d4-a716-446655440000",
  subId: validInput.subId,
  email: "test@example.com",
});

const existingArtist = reconstructArtist({
  artistId: "artist-1",
  accountId: "old_handle",
  ownerUserId: existingUser.getId(),
  profile: null,
});

describe("updateMyAccountIdUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("既存ユーザーのaccountIdを更新し、新しいaccountIdを返す", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);
    deps.artistRepository.findByAccountId.mockResolvedValue(null);
    deps.artistRepository.updateAccountId.mockResolvedValue(
      reconstructArtist({
        artistId: existingArtist.getArtistId(),
        accountId: validInput.accountId,
        ownerUserId: existingArtist.getOwnerUserId(),
        profile: null,
      }),
    );

    const result = await updateMyAccountIdUseCase(validInput, deps);

    expect(result).toStrictEqual({
      artistId: existingArtist.getArtistId(),
      accountId: validInput.accountId,
    });
    expect(deps.artistRepository.updateAccountId).toHaveBeenCalledTimes(1);
  });

  it("現在のaccountIdと同じ値の場合は更新せず early return する", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);

    const result = await updateMyAccountIdUseCase(
      { ...validInput, accountId: "old_handle" },
      deps,
    );

    expect(result).toStrictEqual({
      artistId: existingArtist.getArtistId(),
      accountId: "old_handle",
    });
    expect(deps.artistRepository.findByAccountId).not.toHaveBeenCalled();
    expect(deps.artistRepository.updateAccountId).not.toHaveBeenCalled();
  });

  it("他のartistが同じaccountIdを使用している場合はAccountIdAlreadyTakenErrorをスローする", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);
    const otherArtist = reconstructArtist({
      artistId: "artist-2",
      accountId: validInput.accountId,
      ownerUserId: "other-user",
      profile: null,
    });
    deps.artistRepository.findByAccountId.mockResolvedValue(otherArtist);

    const promise = updateMyAccountIdUseCase(validInput, deps);

    await expect(promise).rejects.toSatisfy(isAccountIdAlreadyTakenError);
    expect(deps.artistRepository.updateAccountId).not.toHaveBeenCalled();
  });

  it("ユーザーが存在しない場合はUserNotFoundErrorをスローする", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(null);

    const promise = updateMyAccountIdUseCase(validInput, deps);

    await expect(promise).rejects.toSatisfy(isUserNotFoundError);
    expect(deps.artistRepository.updateAccountId).not.toHaveBeenCalled();
  });

  it("artistが存在しない場合はArtistNotFoundErrorをスローする", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(null);

    const promise = updateMyAccountIdUseCase(validInput, deps);

    await expect(promise).rejects.toSatisfy(isArtistNotFoundError);
    expect(deps.artistRepository.updateAccountId).not.toHaveBeenCalled();
  });

  it("accountIdが不正な形式の場合は、トランザクション開始前にInvalidAccountIdFormatErrorをスローする", async () => {
    const deps = createMockDeps();

    const promise = updateMyAccountIdUseCase(
      { ...validInput, accountId: "invalid handle" },
      deps,
    );

    await expect(promise).rejects.toMatchObject({
      type: "InvalidAccountIdFormatError",
    });
    expect(deps.txRunner.run).not.toHaveBeenCalled();
    expect(deps.userRepository.findBySub).not.toHaveBeenCalled();
  });
});
