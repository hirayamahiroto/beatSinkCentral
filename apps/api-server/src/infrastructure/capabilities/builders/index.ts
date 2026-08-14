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
import { createLinkTypeReader } from "../../repositories/linkTypeRepository";
import type { Executor } from "../../transaction";
import type { User } from "../../../domain/users/entities";
import type {
  Actor,
  PublicReadCapabilities,
  ArtistReadCapabilities,
  RegistrationCapabilities,
  UserWriteCapabilities,
  ArtistWriteCapabilities,
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
    artistProfiles: {
      ...createArtistProfileReader(executor),
      ...createArtistProfileWriter(executor),
    },
  });

export const buildRegistrationCapabilities = (
  executor: Executor,
): RegistrationCapabilities => buildAccountRepositories(executor);
