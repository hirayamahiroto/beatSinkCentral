import { getDb } from "../database";
import { runInTransaction } from "../transaction";
import { createUserReader } from "../repositories/userRepository";
import { createArtistReader } from "../repositories/artistRepository";
import { resolveActorState } from "./resolveActorState";
import {
  buildPublicReadCapabilities,
  buildReadCapabilities,
  buildRegistrationCapabilities,
  buildUserWriteCapabilities,
  buildWriteCapabilities,
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

        buildReadCapabilities: (actor) => buildReadCapabilities(actor)(db),

        runWithUserWriteCapabilities: (user, work) =>
          runInTransaction(db, buildUserWriteCapabilities(user), work),

        runWithWriteCapabilities: (actor, work) =>
          runInTransaction(db, buildWriteCapabilities(actor), work),

        runWithRegistrationCapabilities: (work) =>
          runInTransaction(db, buildRegistrationCapabilities, work),
      };
    }
    return deps;
  };
})();
