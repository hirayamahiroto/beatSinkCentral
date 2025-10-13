import { User } from "../../../entities/user";
import {
  IUserRepository,
  CreateUserDto,
} from "../../../repositories/IUserRepository";

export interface RegisterUserInput {
  auth0UserId: string;
  email: string;
  username: string;
  attributes?: Record<string, unknown>;
}

export interface RegisterUserOutput {
  user: User;
  isArtist: boolean;
}

/**
 * ユーザー登録ユースケース
 *
 * Auth0で認証済みのユーザーのプロフィール情報を自社DBに登録する
 *
 * 機能:
 * - Auth0ユーザーIDで既存チェック
 * - 既存の場合は既存ユーザーを返す
 * - 新規の場合はユーザーを作成
 * - 登録時点ではアーティストではない
 */
export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // Auth0ユーザーIDで既存チェック
    const existingUser = await this.userRepository.findByAuth0UserId(
      input.auth0UserId
    );
    if (existingUser) {
      // 既に登録済みの場合は既存ユーザーを返す
      return {
        user: existingUser,
        isArtist: false,
      };
    }

    // 新規ユーザーを作成
    const createDto: CreateUserDto = {
      auth0UserId: input.auth0UserId,
      email: input.email,
      username: input.username,
      attributes: input.attributes || {},
    };

    const user = await this.userRepository.create(createDto);

    return {
      user,
      isArtist: false,
    };
  }
}
