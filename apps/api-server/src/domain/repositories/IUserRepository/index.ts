import { User } from "../../entities/user";

export interface CreateUserDto {
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
   * IDでユーザーを取得
   */
  findById(id: string): Promise<User | null>;

  /**
   * メールアドレスでユーザーを取得
   */
  findByEmail(email: string): Promise<User | null>;
}
