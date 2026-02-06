import { getDb } from "../database";
import { createUserRepository } from "../repositories/userRepository";
import type { IUserRepository } from "../../domain/users/repositories";

export type Container = {
  userRepository: IUserRepository;
};

export const getContainer = (() => {
  let container: Container | null = null;

  return (): Container => {
    if (!container) {
      const db = getDb();
      container = {
        userRepository: createUserRepository(db),
      };
    }
    return container;
  };
})();
