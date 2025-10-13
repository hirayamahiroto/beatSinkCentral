import { User } from "../../entities/user";

export interface CreateUserDto {
  auth0UserId: string;
  email: string;
  username: string;
  attributes?: Record<string, unknown>;
}

export interface IUserRepository {
  /**
   * ユーザーを作成
   */
  create(dto: CreateUserDto): Promise<User>;

  /**
   * Auth0ユーザーIDでユーザーを取得
   */
  findByAuth0UserId(auth0UserId: string): Promise<User | null>;
}
