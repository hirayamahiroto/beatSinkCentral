import { getDb } from "../database";
import { createUserRepository } from "../repositories/userRepository";
import { createArtistRepository } from "../repositories/artistRepository";
import { createArtistProfileRepository } from "../repositories/artistProfileRepository";
import { createLinkTypeRepository } from "../repositories/linkTypeRepository";
import { createTransactionRunner } from "../transaction";
import {
  updateMyEmailUseCase,
  type UpdateMyEmailInput,
  type UpdateMyEmailOutput,
} from "../../usecases/users/updateMyEmail";
import type { IUserRepository } from "../../domain/users/repositories";
import type { IArtistRepository } from "../../domain/artists/repositories";
import type { IArtistProfileRepository } from "../../domain/artistProfiles/repositories";
import type { ILinkTypeRepository } from "../../domain/linkTypes/repositories";
import type { ITransactionRunner } from "../transaction";

export type Container = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  artistProfileRepository: IArtistProfileRepository;
  linkTypeRepository: ILinkTypeRepository;
  txRunner: ITransactionRunner;
  usecases: {
    updateMyEmail: (input: UpdateMyEmailInput) => Promise<UpdateMyEmailOutput>;
  };
};

export const getContainer = (() => {
  let container: Container | null = null;

  return (): Container => {
    if (!container) {
      const db = getDb();
      const userRepository = createUserRepository(db);
      const artistRepository = createArtistRepository(db);
      const artistProfileRepository = createArtistProfileRepository(db);
      const linkTypeRepository = createLinkTypeRepository(db);
      const txRunner = createTransactionRunner(db);

      container = {
        userRepository,
        artistRepository,
        artistProfileRepository,
        linkTypeRepository,
        txRunner,
        usecases: {
          updateMyEmail: updateMyEmailUseCase({ userRepository, txRunner }),
        },
      };
    }
    return container;
  };
})();
