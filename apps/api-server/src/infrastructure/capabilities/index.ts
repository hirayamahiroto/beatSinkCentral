import { getDb } from "../database";
import {
  createUserReader,
  createUserWriter,
} from "../repositories/userRepository";
import {
  createArtistReader,
  createArtistWriter,
} from "../repositories/artistRepository";
import {
  createArtistProfileReader,
  createArtistProfileWriter,
} from "../repositories/artistProfileRepository";
import { createLinkTypeReader } from "../repositories/linkTypeRepository";
import type { DatabaseClient } from "../../../../../packages/database/src/utils/createClient";
import type { TransactionContext } from "../transaction";
import type {
  Actor,
  ActorResolution,
  CapabilityDeps,
  PublicReadCapabilities,
  ReadCapabilities,
  RegistrationCapabilities,
  WriteCapabilities,
} from "../../usecases/capabilities";
import type { Result } from "../../utils/result";

type Executor = DatabaseClient | TransactionContext;

// Drizzle の transaction は throw でしかロールバックしないため、業務エラー（err）を
// 例外に載せて境界の外で復元する
class RollbackSignal<T, E> extends Error {
  constructor(readonly result: Result<T, E>) {
    super("rollback");
  }
}

const runInTransaction = async <Caps, T, E>(
  db: DatabaseClient,
  buildCaps: (executor: Executor) => Caps,
  work: (caps: Caps) => Promise<Result<T, E>>,
): Promise<Result<T, E>> => {
  try {
    return await db.transaction(async (tx) => {
      const result = await work(buildCaps(tx));
      if (!result.ok) throw new RollbackSignal(result);
      return result;
    });
  } catch (error) {
    if (error instanceof RollbackSignal) return error.result;
    throw error;
  }
};

export const getCapabilityDeps = (() => {
  let deps: CapabilityDeps | null = null;

  return (): CapabilityDeps => {
    if (!deps) {
      const db = getDb();

      const buildWriteCapabilities =
        (actor: Actor) =>
        (executor: Executor): WriteCapabilities => ({
          actor,
          artistProfiles: {
            ...createArtistProfileReader(executor),
            ...createArtistProfileWriter(executor),
          },
        });

      const buildRegistrationCapabilities = (
        executor: Executor,
      ): RegistrationCapabilities => ({
        users: {
          ...createUserReader(executor),
          ...createUserWriter(executor),
        },
        artists: {
          ...createArtistReader(executor),
          ...createArtistWriter(executor),
        },
      });

      deps = {
        async resolveActorState(subId): Promise<ActorResolution> {
          const user = await createUserReader(db).findBySub(subId);
          if (!user) return { status: "unregistered" };

          const artist = await createArtistReader(db).findByUserId(
            user.getId(),
          );
          if (!artist) return { status: "userOnly", user };

          return { status: "complete", actor: { user, artist } };
        },

        buildPublicReadCapabilities(): PublicReadCapabilities {
          return {
            artistProfiles: createArtistProfileReader(db),
            linkTypes: createLinkTypeReader(db),
          };
        },

        buildReadCapabilities(actor: Actor): ReadCapabilities {
          return { actor, artistProfiles: createArtistProfileReader(db) };
        },

        runWithWriteCapabilities(actor, work) {
          return runInTransaction(db, buildWriteCapabilities(actor), work);
        },

        runWithRegistrationCapabilities(work) {
          return runInTransaction(db, buildRegistrationCapabilities, work);
        },
      };
    }
    return deps;
  };
})();
