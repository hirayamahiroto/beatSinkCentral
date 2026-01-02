import { User } from "../entities";

export interface IUserRepository {
  save(user: User): Promise<string>;
  findUserIdBySub(sub: string): Promise<string | null>;
}
