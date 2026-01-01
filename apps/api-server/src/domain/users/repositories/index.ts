import { User } from "../entities";

export type CreateUserParams = {
  accountId: string;
  sub: string;
  email: string;
  name: string;
};

export interface IUserRepository {
  create(params: CreateUserParams): Promise<User>;
  findBySub(sub: string): Promise<User | null>;
}
