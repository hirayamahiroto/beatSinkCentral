import { User } from "../entities";

export type CreateUserParams = {
  auth0UserId: string;
  email: string;
  username: string;
  attributes?: Record<string, unknown>;
};

export interface IUserRepository {
  create(params: CreateUserParams): Promise<User>;
  findByAuth0UserId(auth0UserId: string): Promise<User | null>;
}
