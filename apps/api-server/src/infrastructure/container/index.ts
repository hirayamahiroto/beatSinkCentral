import { getDb } from "../database";
import { createUserRepository } from "../repositories/userRepository";
import { createArtistRepository } from "../repositories/artistRepository";
import { createArtistProfileRepository } from "../repositories/artistProfileRepository";
import { createLinkTypeRepository } from "../repositories/linkTypeRepository";
import { createTransactionRunner } from "../transaction";
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
};

export const getContainer = (() => {
  let container: Container | null = null;

  return (): Container => {
    if (!container) {
      const db = getDb();
      container = {
        userRepository: createUserRepository(db),
        artistRepository: createArtistRepository(db),
        artistProfileRepository: createArtistProfileRepository(db),
        linkTypeRepository: createLinkTypeRepository(db),
        txRunner: createTransactionRunner(db),
      };
    }
    return container;
  };
})();
