import { getDb } from "../database";
import { createUserRepository } from "../repositories/userRepository";
import { createArtistRepository } from "../repositories/artistRepository";
import type { IUserRepository } from "../../domain/users/repositories";
import type { IArtistRepository } from "../../domain/artists/repositories";

export type Container = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
};

export const getContainer = (() => {
  let container: Container | null = null;

  return (): Container => {
    if (!container) {
      const db = getDb();
      container = {
        userRepository: createUserRepository(db),
        artistRepository: createArtistRepository(db),
      };
    }
    return container;
  };
})();
