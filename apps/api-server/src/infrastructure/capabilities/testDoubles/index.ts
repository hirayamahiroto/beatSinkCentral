import { vi } from "vitest";
import type { CapabilityDeps } from "../../../capabilities";
import type {
  IUserReader,
  IUserWriter,
} from "../../../domain/users/repositories";
import type {
  IArtistReader,
  IArtistWriter,
} from "../../../domain/artists/repositories";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
  IProfileImageStorage,
} from "../../../domain/artistProfiles/repositories";
import type {
  IOfferReader,
  IOfferWriter,
} from "../../../domain/offers/repositories";
import type { ILinkTypeReader } from "../../../domain/linkTypes/repositories";
import type { IStoryQuestionReader } from "../../../domain/storyQuestions/repositories";
import type { IPresentationPatternReader } from "../../../domain/presentationPatterns/repositories";
import type { IAnalyticsEventWriter } from "../../../domain/analyticsEvents/repositories";
import type { IArtistHandleHistoryWriter } from "../../../domain/artistHandleHistories/repositories";

const createUsersMock = () =>
  ({
    findBySub: vi.fn<IUserReader["findBySub"]>(),
    save: vi.fn<IUserWriter["save"]>(),
    updateEmail: vi.fn<IUserWriter["updateEmail"]>(),
  }) satisfies IUserReader & IUserWriter;

const createArtistsMock = () =>
  ({
    findByUserId: vi.fn<IArtistReader["findByUserId"]>(),
    findByHandle: vi.fn<IArtistReader["findByHandle"]>(),
    findByHandles: vi.fn<IArtistReader["findByHandles"]>(),
    save: vi.fn<IArtistWriter["save"]>(),
    updateHandle: vi.fn<IArtistWriter["updateHandle"]>(),
  }) satisfies IArtistReader & IArtistWriter;

const createArtistProfilesMock = () =>
  ({
    load: vi.fn<IArtistProfileReader["load"]>(),
    findPublishedByHandle:
      vi.fn<IArtistProfileReader["findPublishedByHandle"]>(),
    listPublishedSummaries:
      vi.fn<IArtistProfileReader["listPublishedSummaries"]>(),
    save: vi.fn<IArtistProfileWriter["save"]>(),
    publish: vi.fn<IArtistProfileWriter["publish"]>(),
  }) satisfies IArtistProfileReader & IArtistProfileWriter;

const createOffersMock = () =>
  ({
    findLatestByArtistId: vi.fn<IOfferReader["findLatestByArtistId"]>(),
    upsert: vi.fn<IOfferWriter["upsert"]>(),
  }) satisfies IOfferReader & IOfferWriter;

const createLinkTypesMock = () =>
  ({ findAll: vi.fn<ILinkTypeReader["findAll"]>() }) satisfies ILinkTypeReader;

const createStoryQuestionsMock = () =>
  ({
    findAll: vi.fn<IStoryQuestionReader["findAll"]>(),
  }) satisfies IStoryQuestionReader;

const createPresentationPatternsMock = () =>
  ({
    findAll: vi.fn<IPresentationPatternReader["findAll"]>(),
  }) satisfies IPresentationPatternReader;

const createAnalyticsEventsMock = () =>
  ({
    record: vi.fn<IAnalyticsEventWriter["record"]>(),
  }) satisfies IAnalyticsEventWriter;

const createArtistHandleHistoriesMock = () =>
  ({
    record: vi.fn<IArtistHandleHistoryWriter["record"]>(),
  }) satisfies IArtistHandleHistoryWriter;

const createProfileImagesMock = () =>
  ({
    upload: vi.fn<IProfileImageStorage["upload"]>(),
  }) satisfies IProfileImageStorage;

export const createCapabilityDepsMock = () => {
  const users = createUsersMock();
  const artists = createArtistsMock();
  const artistProfiles = createArtistProfilesMock();
  const offers = createOffersMock();
  const linkTypes = createLinkTypesMock();
  const storyQuestions = createStoryQuestionsMock();
  const presentationPatterns = createPresentationPatternsMock();
  const analyticsEvents = createAnalyticsEventsMock();
  const artistHandleHistories = createArtistHandleHistoriesMock();
  const profileImages = createProfileImagesMock();
  const resolveActorState = vi.fn<CapabilityDeps["resolveActorState"]>();

  const deps = {
    resolveActorState,

    buildPublicReadCapabilities: () => ({
      artistProfiles,
      linkTypes,
      storyQuestions,
      presentationPatterns,
    }),

    buildPublicWriteCapabilities: () => ({ analyticsEvents }),

    buildArtistReadCapabilities: (actor) => ({ actor, artistProfiles, offers }),

    buildArtistStorageWriteCapabilities: (actor) => ({ actor, profileImages }),

    runWithUserWriteCapabilities: (user, work) => work({ user, users }),

    runWithArtistWriteCapabilities: (actor, work) =>
      work({
        actor,
        users,
        artists,
        artistHandleHistories,
        artistProfiles,
        offers,
      }),

    runWithRegistrationCapabilities: (work) => work({ users, artists }),
  } satisfies CapabilityDeps;

  return {
    deps,
    resolveActorState,
    users,
    artists,
    artistProfiles,
    offers,
    linkTypes,
    storyQuestions,
    presentationPatterns,
    analyticsEvents,
    artistHandleHistories,
    profileImages,
  };
};
