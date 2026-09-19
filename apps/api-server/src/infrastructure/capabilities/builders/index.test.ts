import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildPublicReadCapabilities,
  buildPublicWriteCapabilities,
  buildArtistReadCapabilities,
  buildRegistrationCapabilities,
  buildUserWriteCapabilities,
  buildArtistWriteCapabilities,
} from "./index";
import { createUserReader } from "../../repositories/userRepository";
import { createArtistReader } from "../../repositories/artistRepository";
import {
  createArtistProfileReader,
  createArtistProfileWriter,
} from "../../repositories/artistProfileRepository";
import { createArtistHandleHistoryWriter } from "../../repositories/artistHandleHistoryRepository";
import {
  createOfferReader,
  createOfferWriter,
} from "../../repositories/offerRepository";
import { createLinkTypeReader } from "../../repositories/linkTypeRepository";
import { createAnalyticsEventWriter } from "../../repositories/analyticsEventRepository";
import { createStoryQuestionReader } from "../../repositories/storyQuestionRepository";
import { createPresentationPatternReader } from "../../repositories/presentationPatternRepository";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";

vi.mock("../../repositories/userRepository", () => ({
  createUserReader: vi.fn(() => ({ findBySub: vi.fn() })),
  createUserWriter: vi.fn(() => ({ save: vi.fn(), updateEmail: vi.fn() })),
}));

vi.mock("../../repositories/artistRepository", () => ({
  createArtistReader: vi.fn(() => ({
    findByUserId: vi.fn(),
    findByHandle: vi.fn(),
  })),
  createArtistWriter: vi.fn(() => ({
    save: vi.fn(),
    updateHandle: vi.fn(),
  })),
}));

vi.mock("../../repositories/artistProfileRepository", () => ({
  createArtistProfileReader: vi.fn(() => ({
    findByArtistId: vi.fn(),
    findPublishedByHandle: vi.fn(),
    listPublishedSummaries: vi.fn(),
  })),
  createArtistProfileWriter: vi.fn(() => ({
    upsert: vi.fn(),
    setPublished: vi.fn(),
  })),
}));

vi.mock("../../repositories/artistHandleHistoryRepository", () => ({
  createArtistHandleHistoryWriter: vi.fn(() => ({ record: vi.fn() })),
}));

vi.mock("../../repositories/offerRepository", () => ({
  createOfferReader: vi.fn(() => ({ findLatestByArtistId: vi.fn() })),
  createOfferWriter: vi.fn(() => ({ upsert: vi.fn() })),
}));

vi.mock("../../repositories/linkTypeRepository", () => ({
  createLinkTypeReader: vi.fn(() => ({ findAll: vi.fn() })),
}));

vi.mock("../../repositories/analyticsEventRepository", () => ({
  createAnalyticsEventWriter: vi.fn(() => ({ record: vi.fn() })),
}));

vi.mock("../../repositories/storyQuestionRepository", () => ({
  createStoryQuestionReader: vi.fn(() => ({ findAll: vi.fn() })),
}));

vi.mock("../../repositories/presentationPatternRepository", () => ({
  createPresentationPatternReader: vi.fn(() => ({ findAll: vi.fn() })),
}));

const executor = { marker: "executor" } as never;

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

const actor = { user, artist };

describe("buildPublicReadCapabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("公開データの Reader だけを渡した executor で組み立てる", () => {
    const caps = buildPublicReadCapabilities(executor);

    expect(Object.keys(caps).sort()).toStrictEqual([
      "artistProfiles",
      "linkTypes",
      "presentationPatterns",
      "storyQuestions",
    ]);
    expect(createArtistProfileReader).toHaveBeenCalledWith(executor);
    expect(createLinkTypeReader).toHaveBeenCalledWith(executor);
    expect(createStoryQuestionReader).toHaveBeenCalledWith(executor);
    expect(createPresentationPatternReader).toHaveBeenCalledWith(executor);
    expect(createArtistProfileWriter).not.toHaveBeenCalled();
  });
});

describe("buildPublicWriteCapabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("analyticsEventsのWriterだけを渡した executor で組み立てる", () => {
    const caps = buildPublicWriteCapabilities(executor);

    expect(Object.keys(caps).sort()).toStrictEqual(["analyticsEvents"]);
    expect(createAnalyticsEventWriter).toHaveBeenCalledWith(executor);
  });
});

describe("buildArtistReadCapabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Actor と Reader だけを渡し、Writer は渡さない", () => {
    const caps = buildArtistReadCapabilities(actor)(executor);

    expect(Object.keys(caps).sort()).toStrictEqual([
      "actor",
      "artistProfiles",
      "offers",
    ]);
    expect(caps.actor).toBe(actor);
    expect(createArtistProfileReader).toHaveBeenCalledWith(executor);
    expect(createOfferReader).toHaveBeenCalledWith(executor);
    expect(createArtistProfileWriter).not.toHaveBeenCalled();
    expect(createOfferWriter).not.toHaveBeenCalled();
    expect(createStoryQuestionReader).not.toHaveBeenCalled();
  });
});

describe("buildUserWriteCapabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("User と users のみを渡し、artists / artistProfiles は渡さない", () => {
    const caps = buildUserWriteCapabilities(user)(executor);

    expect(Object.keys(caps).sort()).toStrictEqual(["user", "users"]);
    expect(caps.user).toBe(user);
    expect(createUserReader).toHaveBeenCalledWith(executor);
    expect(createArtistReader).not.toHaveBeenCalled();
    expect(createArtistProfileReader).not.toHaveBeenCalled();
  });
});

describe("buildArtistWriteCapabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Actor と全集約の Reader / Writer を渡した executor で組み立てる", () => {
    const caps = buildArtistWriteCapabilities(actor)(executor);

    expect(Object.keys(caps).sort()).toStrictEqual([
      "actor",
      "artistHandleHistories",
      "artistProfiles",
      "artists",
      "offers",
      "users",
    ]);
    expect(caps.actor).toBe(actor);
    expect(createUserReader).toHaveBeenCalledWith(executor);
    expect(createArtistHandleHistoryWriter).toHaveBeenCalledWith(executor);
    expect(createArtistProfileWriter).toHaveBeenCalledWith(executor);
    expect(createOfferReader).toHaveBeenCalledWith(executor);
    expect(createOfferWriter).toHaveBeenCalledWith(executor);
  });
});

describe("buildRegistrationCapabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("主体を持たず、users / artists のみを渡す", () => {
    const caps = buildRegistrationCapabilities(executor);

    expect(Object.keys(caps).sort()).toStrictEqual(["artists", "users"]);
    expect(createUserReader).toHaveBeenCalledWith(executor);
    expect(createArtistProfileReader).not.toHaveBeenCalled();
  });
});
