import { User } from "../../domain/users/entities";
import { IUserRepository } from "../../domain/users/repositories";

export interface CreateUserInput {
  accountId: string;
  sub: string;
  email: string;
  name: string;
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
 * - subで既存チェック
 * - 既存の場合は既存ユーザーを返す（冪等性）
 * - 新規の場合はユーザーを作成
 * - 作成時点ではアーティストではない
 */
export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // subで既存チェック
    const existingUser = await this.userRepository.findBySub(input.sub);
    if (existingUser) {
      // 既に存在する場合は既存ユーザーを返す（冪等性）
      return {
        user: existingUser,
        isArtist: false,
      };
    }

    // 新規ユーザーを作成
    const user = await this.userRepository.create({
      accountId: input.accountId,
      sub: input.sub,
      email: input.email,
      name: input.name,
    });

    return {
      user,
      isArtist: false,
    };
  }
}
