import { User } from "../entities";

export interface IUserRepository {
  save(user: User): Promise<string>;
  findUserIdBySub(sub: string): Promise<string | null>;
  findBySub(sub: string): Promise<{ id: string; email: string } | null>;
}
