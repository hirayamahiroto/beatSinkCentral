import {
  createUserReader,
  createUserWriter,
} from "../../repositories/userRepository";
import {
  createArtistReader,
  createArtistWriter,
} from "../../repositories/artistRepository";
import {
  createArtistProfileReader,
  createArtistProfileWriter,
} from "../../repositories/artistProfileRepository";
import { createArtistHandleHistoryWriter } from "../../repositories/artistHandleHistoryRepository";
import { createLinkTypeReader } from "../../repositories/linkTypeRepository";
import { createAnalyticsEventWriter } from "../../repositories/analyticsEventRepository";
import { createStoryQuestionReader } from "../../repositories/storyQuestionRepository";
import { createPresentationPatternReader } from "../../repositories/presentationPatternRepository";
import type { Executor } from "../../transaction";
import type { User } from "../../../domain/users/entities";
import type { IProfileImageStorage } from "../../../domain/artistProfiles/repositories";
import type {
  Actor,
  PublicReadCapabilities,
  PublicWriteCapabilities,
  ArtistReadCapabilities,
  RegistrationCapabilities,
  UserWriteCapabilities,
  ArtistWriteCapabilities,
  ArtistStorageWriteCapabilities,
} from "../../../usecases/capabilities";

const buildUserRepository = (executor: Executor) => ({
  ...createUserReader(executor),
  ...createUserWriter(executor),
});

const buildAccountRepositories = (executor: Executor) => ({
  users: buildUserRepository(executor),
  artists: {
    ...createArtistReader(executor),
    ...createArtistWriter(executor),
  },
});

export const buildPublicReadCapabilities = (
  executor: Executor,
): PublicReadCapabilities => ({
  artistProfiles: createArtistProfileReader(executor),
  linkTypes: createLinkTypeReader(executor),
  storyQuestions: createStoryQuestionReader(executor),
  presentationPatterns: createPresentationPatternReader(executor),
});

export const buildPublicWriteCapabilities = (
  executor: Executor,
): PublicWriteCapabilities => ({
  analyticsEvents: createAnalyticsEventWriter(executor),
});

export const buildArtistReadCapabilities =
  (actor: Actor) =>
  (executor: Executor): ArtistReadCapabilities => ({
    actor,
    artistProfiles: createArtistProfileReader(executor),
  });

export const buildUserWriteCapabilities =
  (user: User) =>
  (executor: Executor): UserWriteCapabilities => ({
    user,
    users: buildUserRepository(executor),
  });

export const buildArtistWriteCapabilities =
  (actor: Actor) =>
  (executor: Executor): ArtistWriteCapabilities => ({
    actor,
    ...buildAccountRepositories(executor),
    artistHandleHistories: createArtistHandleHistoryWriter(executor),
    artistProfiles: {
      ...createArtistProfileReader(executor),
      ...createArtistProfileWriter(executor),
    },
  });

export const buildRegistrationCapabilities = (
  executor: Executor,
): RegistrationCapabilities => buildAccountRepositories(executor);

export const buildArtistStorageWriteCapabilities =
  (actor: Actor) =>
  (profileImages: IProfileImageStorage): ArtistStorageWriteCapabilities => ({
    actor,
    profileImages,
  });
