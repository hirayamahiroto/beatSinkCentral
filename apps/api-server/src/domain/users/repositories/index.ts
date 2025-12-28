import { User } from "../entities";
import { CreateUserDto } from "../dataTransferObjects";

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
