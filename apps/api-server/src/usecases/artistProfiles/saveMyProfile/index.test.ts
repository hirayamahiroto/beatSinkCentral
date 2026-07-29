import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveMyProfileUseCase, type SaveMyProfileDeps } from "./index";
import { isUserNotFoundError } from "../../../domain/users/policies/assertRegistered";
import { isProfileNotPublishableError } from "../../../domain/artistProfiles/policies/assertProfilePublishable";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";
import type { ArtistProfilePersistenceData } from "../../../domain/artistProfiles/entities";

const createMockDeps = () =>
  ({
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
    artistProfileRepository: {
      findByArtistId: vi.fn(),
      findPublishedByAccountId: vi.fn(),
      upsert: vi.fn(),
      setPublished: vi.fn(),
    },
    txRunner: {
      run: vi.fn(async (fn) => fn({} as Parameters<typeof fn>[0])),
    },
  }) satisfies SaveMyProfileDeps;

const existingUser = reconstructUser({
  id: "550e8400-e29b-41d4-a716-446655440000",
  subId: "auth0|123456789",
  email: "test@example.com",
});

const existingArtist = reconstructArtist({
  artistId: "artist-1",
  accountId: "beatboxer_taro",
  ownerUserId: existingUser.getId(),
  profile: null,
});

const echoUpsert = (data: ArtistProfilePersistenceData) =>
  reconstructArtistProfile({ ...data });

describe("saveMyProfileUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("新規プロフィールを作成し、保存内容を view で返す", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);
    deps.artistProfileRepository.findByArtistId.mockResolvedValue(null);
    deps.artistProfileRepository.upsert.mockImplementation(async (data) =>
      echoUpsert(data),
    );

    const result = await saveMyProfileUseCase(
      {
        subId: existingUser.getSub(),
        name: "Taro",
        story: "私の歩み",
        genres: ["bass", "inward"],
        links: [{ type: "x", url: "https://x.com/taro" }],
      },
      deps,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accountId).toBe("beatboxer_taro");
      expect(result.value.profile.name).toBe("Taro");
      expect(result.value.profile.genres).toEqual(["bass", "inward"]);
      expect(result.value.profile.published).toBe(false);
    }
    expect(deps.artistProfileRepository.upsert).toHaveBeenCalledTimes(1);
  });

  it("既存プロフィールがある場合は ID と公開状態を保持して更新する", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);
    deps.artistProfileRepository.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-existing",
        artistId: "artist-1",
        published: true,
        name: "Old Name",
        imageUrl: "https://example.com/a.png",
        story: "旧",
        genres: ["bass"],
        links: [{ type: "x", url: "https://x.com/taro" }],
      }),
    );
    deps.artistProfileRepository.upsert.mockImplementation(async (data) =>
      echoUpsert(data),
    );

    await saveMyProfileUseCase(
      {
        subId: existingUser.getSub(),
        name: "New Name",
        imageUrl: "https://example.com/a.png",
        story: "旧",
        genres: ["bass"],
        links: [{ type: "x", url: "https://x.com/taro" }],
      },
      deps,
    );

    const persisted = deps.artistProfileRepository.upsert.mock
      .calls[0][0] as ArtistProfilePersistenceData;
    expect(persisted.id).toBe("profile-existing");
    expect(persisted.published).toBe(true);
    expect(persisted.name).toBe("New Name");
  });

  it("公開中のプロフィールから必須項目を落とす保存は err(ProfileNotPublishableError)", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);
    deps.artistProfileRepository.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-existing",
        artistId: "artist-1",
        published: true,
        name: "Old Name",
        imageUrl: "https://example.com/a.png",
        story: "旧",
        genres: ["bass"],
        links: [{ type: "x", url: "https://x.com/taro" }],
      }),
    );

    const result = await saveMyProfileUseCase(
      { subId: existingUser.getSub(), name: "New Name" },
      deps,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isProfileNotPublishableError(result.error)).toBe(true);
    }
    expect(deps.artistProfileRepository.upsert).not.toHaveBeenCalled();
  });

  it("ユーザー未登録なら err(UserNotFoundError)（保存しない）", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(null);

    const result = await saveMyProfileUseCase(
      { subId: "auth0|unknown", name: "Taro" },
      deps,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(isUserNotFoundError(result.error)).toBe(true);
    }
    expect(deps.artistProfileRepository.upsert).not.toHaveBeenCalled();
  });

  it("不正な画像 URL は InvalidImageUrlFormatError をスローする", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);
    deps.artistProfileRepository.findByArtistId.mockResolvedValue(null);

    const promise = saveMyProfileUseCase(
      { subId: existingUser.getSub(), imageUrl: "not-a-url" },
      deps,
    );

    await expect(promise).rejects.toMatchObject({
      type: "InvalidImageUrlFormatError",
    });
    expect(deps.artistProfileRepository.upsert).not.toHaveBeenCalled();
  });
});
