import { getDb } from "../database";
import { createUserRepository } from "../repositories/userRepository";
import { createArtistRepository } from "../repositories/artistRepository";
import {
  createArtistProfileReader,
  createArtistProfileWriter,
} from "../repositories/artistProfileRepository";
import type { DatabaseClient } from "../../../../../packages/database/src/utils/createClient";
import type { TransactionContext } from "../transaction";
import type {
  Actor,
  CapabilityDeps,
  PublicReadCapabilities,
  ReadCapabilities,
  WriteCapabilities,
} from "../../usecases/capabilities";
import { createUserNotFoundError } from "../../domain/users/policies/assertRegistered";
import { createArtistNotFoundError } from "../../domain/artists/policies/assertArtistExists";
import { type Result, ok, err } from "../../utils/result";

type Executor = DatabaseClient | TransactionContext;

// Drizzle の transaction は throw でしかロールバックしないため、業務エラー（err）を
// 例外に載せて境界の外で復元する
class RollbackSignal<T, E> extends Error {
  constructor(readonly result: Result<T, E>) {
    super("rollback");
  }
}

export const getCapabilityDeps = (() => {
  let deps: CapabilityDeps | null = null;

  return (): CapabilityDeps => {
    if (!deps) {
      const db = getDb();
      const userRepository = createUserRepository(db);
      const artistRepository = createArtistRepository(db);

      const buildWriteScopedRepos = (executor: Executor) => ({
        artistProfiles: {
          ...createArtistProfileReader(executor),
          ...createArtistProfileWriter(executor),
        },
      });

      deps = {
        async resolveActor(subId) {
          const user = await userRepository.findBySub(subId);
          if (!user) return err(createUserNotFoundError());

          const artist = await artistRepository.findByUserId(user.getId());
          if (!artist) return err(createArtistNotFoundError());

          return ok({ user, artist });
        },

        buildPublicReadCapabilities(): PublicReadCapabilities {
          return { artistProfiles: createArtistProfileReader(db) };
        },

        buildReadCapabilities(actor: Actor): ReadCapabilities {
          return { actor, artistProfiles: createArtistProfileReader(db) };
        },

        async runWithWriteCapabilities(actor, work) {
          try {
            return await db.transaction(async (tx) => {
              const caps: WriteCapabilities = {
                actor,
                ...buildWriteScopedRepos(tx),
              };
              const result = await work(caps);
              if (!result.ok) throw new RollbackSignal(result);
              return result;
            });
          } catch (error) {
            if (error instanceof RollbackSignal) return error.result;
            throw error;
          }
        },
      };
    }
    return deps;
  };
})();
