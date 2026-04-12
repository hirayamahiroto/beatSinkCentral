import { getDb } from "../database";
import { createUserRepository } from "../repositories/userRepository";
import { createArtistRepository } from "../repositories/artistRepository";
import { createArtistOwnerRepository } from "../repositories/artistOwnerRepository";
import { createTransactionRunner } from "../transaction";
import type { IUserRepository } from "../../domain/users/repositories";
import type { IArtistRepository } from "../../domain/artists/repositories";
import type { IArtistOwnerRepository } from "../../domain/artistOwners/repositories";
import type { ITransactionRunner } from "../transaction";

export type Container = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
  artistOwnerRepository: IArtistOwnerRepository;
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
        artistOwnerRepository: createArtistOwnerRepository(db),
        txRunner: createTransactionRunner(db),
      };
    }
    return container;
  };
})();
