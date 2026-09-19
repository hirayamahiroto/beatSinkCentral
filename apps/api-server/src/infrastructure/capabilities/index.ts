import { getDb } from "../database";
import { getStorageClient } from "../storage";
import { runInTransaction } from "../transaction";
import { createUserReader } from "../repositories/userRepository";
import { createArtistReader } from "../repositories/artistRepository";
import { createProfileImageStorage } from "../repositories/profileImageStorage";
import { resolveActorState } from "./resolveActorState";
import {
  buildPublicReadCapabilities,
  buildPublicWriteCapabilities,
  buildArtistReadCapabilities,
  buildRegistrationCapabilities,
  buildUserWriteCapabilities,
  buildArtistWriteCapabilities,
  buildArtistStorageWriteCapabilities,
} from "./builders";
import type { CapabilityDeps } from "../../usecases/capabilities";

export const getCapabilityDeps = (() => {
  let deps: CapabilityDeps | null = null;

  return (): CapabilityDeps => {
    if (!deps) {
      const db = getDb();

      const actorStateReaders = {
        users: createUserReader(db),
        artists: createArtistReader(db),
      };

      deps = {
        resolveActorState: (subId) =>
          resolveActorState(actorStateReaders, subId),

        buildPublicReadCapabilities: () => buildPublicReadCapabilities(db),

        buildPublicWriteCapabilities: () => buildPublicWriteCapabilities(db),

        buildArtistReadCapabilities: (actor) =>
          buildArtistReadCapabilities(actor)(db),

        buildArtistStorageWriteCapabilities: (actor) =>
          buildArtistStorageWriteCapabilities(actor)(
            createProfileImageStorage(getStorageClient),
          ),

        runWithUserWriteCapabilities: (user, work) =>
          runInTransaction(db, buildUserWriteCapabilities(user), work),

        runWithArtistWriteCapabilities: (actor, work) =>
          runInTransaction(db, buildArtistWriteCapabilities(actor), work),

        runWithRegistrationCapabilities: (work) =>
          runInTransaction(db, buildRegistrationCapabilities, work),
      };
    }
    return deps;
  };
})();
