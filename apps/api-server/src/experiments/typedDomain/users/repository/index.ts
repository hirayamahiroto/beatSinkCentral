import type { RegisteredUser } from "../user";

export type UserRepositoryPort = {
  findRegisteredBySub: (sub: string) => Promise<RegisteredUser | null>;
  save: (user: RegisteredUser) => Promise<void>;
};
