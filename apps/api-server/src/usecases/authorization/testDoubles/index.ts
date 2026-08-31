import type {
  ActorResolution,
  CapabilityDeps,
  RegistrationCapabilities,
} from "../../capabilities";
import type {
  IArtistProfileReader,
  IArtistProfileWriter,
  IProfileImageStorage,
} from "../../../domain/artistProfiles/repositories";
import { reconstructUser } from "../../../domain/users/factories";
import { reconstructArtist } from "../../../domain/artists/factories";

export const testUser = reconstructUser({
  id: "user-1",
  subId: "auth0|123",
  email: "test@example.com",
});

export const testArtist = reconstructArtist({
  artistId: "artist-1",
  handle: "user_123",
  ownerUserId: "user-1",
  profile: null,
});

export type BoundaryCalls = {
  resolvedSubIds: string[];
  userWriteBoundaries: number;
  artistWriteBoundaries: number;
  registrationBoundaries: number;
};

const unusedInAuthorizationTests = () => {
  throw new Error("authorization のテストでは呼ばれない");
};

const createArtistProfileReaderStub = (): IArtistProfileReader => ({
  findByArtistId: async () => null,
  findPublishedByHandle: async () => null,
  listPublishedSummaries: async () => [],
});

const createArtistProfileWriterStub = (): IArtistProfileWriter => ({
  upsert: unusedInAuthorizationTests,
  setPublished: unusedInAuthorizationTests,
});

const createProfileImageStorageStub = (): IProfileImageStorage => ({
  upload: unusedInAuthorizationTests,
});

const createRegistrationCapabilitiesStub = (): RegistrationCapabilities => ({
  users: {
    findBySub: async () => null,
    save: unusedInAuthorizationTests,
    updateEmail: unusedInAuthorizationTests,
  },
  artists: {
    findByUserId: async () => null,
    findByHandle: async () => null,
    save: unusedInAuthorizationTests,
    updateHandle: unusedInAuthorizationTests,
  },
});

export const createCapabilityDepsStub = (
  resolution: ActorResolution,
): { deps: CapabilityDeps; calls: BoundaryCalls } => {
  const calls: BoundaryCalls = {
    resolvedSubIds: [],
    userWriteBoundaries: 0,
    artistWriteBoundaries: 0,
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

    buildArtistReadCapabilities: (actor) => ({
      actor,
      artistProfiles: createArtistProfileReaderStub(),
    }),

    buildArtistStorageWriteCapabilities: (actor) => ({
      actor,
      profileImages: createProfileImageStorageStub(),
    }),

    async runWithUserWriteCapabilities(user, work) {
      calls.userWriteBoundaries += 1;
      return work({ user, users: createRegistrationCapabilitiesStub().users });
    },

    async runWithArtistWriteCapabilities(actor, work) {
      calls.artistWriteBoundaries += 1;
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
