import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  publishMyProfileUseCase,
  type PublishMyProfileDeps,
} from "./index";
import { isUserNotFoundError } from "../../../domain/users/policies/assertRegistered";
import { isArtistProfileNotFoundError } from "../../../domain/artistProfiles/policies/assertArtistProfileExists";
import { isProfileNotPublishableError } from "../../../domain/artistProfiles/policies/assertProfilePublishable";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";
import { reconstructArtistProfile } from "../../../domain/artistProfiles/factories";

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
  }) satisfies PublishMyProfileDeps;

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

const publishableProfile = reconstructArtistProfile({
  id: "profile-1",
  artistId: "artist-1",
  published: false,
  name: "Taro",
  imageUrl: "https://example.com/a.png",
  story: "私の歩み",
  genres: ["bass"],
  snsLinks: ["https://x.com/taro"],
});

describe("publishMyProfileUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("最小核が揃っていれば公開でき、published=true を返す", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);
    deps.artistProfileRepository.findByArtistId.mockResolvedValue(
      publishableProfile,
    );
    deps.artistProfileRepository.setPublished.mockResolvedValue(
      publishableProfile.publish(),
    );

    const result = await publishMyProfileUseCase(
      { subId: existingUser.getSub(), published: true },
      deps,
    );

    expect(result).toEqual({ published: true });
    expect(deps.artistProfileRepository.setPublished).toHaveBeenCalledWith(
      { artistId: "artist-1", published: true },
      expect.anything(),
    );
  });

  it("最小核が欠けている状態で公開しようとすると ProfileNotPublishableError", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);
    deps.artistProfileRepository.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
        snsLinks: [],
      }),
    );

    const promise = publishMyProfileUseCase(
      { subId: existingUser.getSub(), published: true },
      deps,
    );

    await expect(promise).rejects.toSatisfy(isProfileNotPublishableError);
    expect(deps.artistProfileRepository.setPublished).not.toHaveBeenCalled();
  });

  it("非公開化は最小核を検証せず常に可能", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);
    deps.artistProfileRepository.findByArtistId.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: true,
        name: "Taro",
      }),
    );
    deps.artistProfileRepository.setPublished.mockResolvedValue(
      reconstructArtistProfile({
        id: "profile-1",
        artistId: "artist-1",
        published: false,
        name: "Taro",
      }),
    );

    const result = await publishMyProfileUseCase(
      { subId: existingUser.getSub(), published: false },
      deps,
    );

    expect(result).toEqual({ published: false });
  });

  it("プロフィール未作成なら ArtistProfileNotFoundError", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(existingUser);
    deps.artistRepository.findByUserId.mockResolvedValue(existingArtist);
    deps.artistProfileRepository.findByArtistId.mockResolvedValue(null);

    const promise = publishMyProfileUseCase(
      { subId: existingUser.getSub(), published: true },
      deps,
    );

    await expect(promise).rejects.toSatisfy(isArtistProfileNotFoundError);
  });

  it("ユーザー未登録なら UserNotFoundError", async () => {
    const deps = createMockDeps();
    deps.userRepository.findBySub.mockResolvedValue(null);

    const promise = publishMyProfileUseCase(
      { subId: "auth0|unknown", published: true },
      deps,
    );

    await expect(promise).rejects.toSatisfy(isUserNotFoundError);
  });
});
