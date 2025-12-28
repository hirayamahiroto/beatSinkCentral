import { User } from "../entities";
import { IUserRepository } from "../repositories";
import { CreateUserDto } from "../dataTransferObjects";

export interface CreateUserInput {
  auth0UserId: string;
  email: string;
  username: string;
  attributes?: Record<string, unknown>;
}

export interface CreateUserOutput {
  user: User;
  isArtist: boolean;
}

/**
 * ユーザー作成ユースケース
 *
 * Auth0で認証済みのユーザーのプロフィール情報を自社DBに作成する
 *
 * 機能:
 * - Auth0ユーザーIDで既存チェック
 * - 既存の場合は既存ユーザーを返す（冪等性）
 * - 新規の場合はユーザーを作成
 * - 作成時点ではアーティストではない
 */
export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // Auth0ユーザーIDで既存チェック
    const existingUser = await this.userRepository.findByAuth0UserId(
      input.auth0UserId
    );
    if (existingUser) {
      // 既に存在する場合は既存ユーザーを返す（冪等性）
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
