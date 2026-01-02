import { createUser } from "../../domain/users/entities";
import { IUserRepository } from "../../domain/users/repositories";

export interface CreateUserInput {
  accountId: string;
  sub: string;
  email: string;
  name: string;
}

export interface CreateUserOutput {
  userId: string;
}

/**
 * ユーザー作成ユースケース
 *
 * Auth0で認証済みのユーザーのプロフィール情報を自社DBに作成する
 *
 * 機能:
 * - subで既存チェック
 * - 既存の場合は既存ユーザーのIDを返す（冪等性）
 * - 新規の場合はユーザーを作成
 * - 作成時点ではアーティストではない
 */
export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // subで既存チェック
    const existingUserId = await this.userRepository.findUserIdBySub(input.sub);
    if (existingUserId) {
      // 既に存在する場合は既存ユーザーのIDを返す（冪等性）
      return {
        userId: existingUserId,
      };
    }

    // UseCase内でEntityを生成（バリデーション実行）
    const user = createUser({
      accountId: input.accountId,
      sub: input.sub,
      email: input.email,
      name: input.name,
    });

    // Entityを永続化し、DBから生成されたIDを取得
    const userId = await this.userRepository.save(user);

    return {
      userId,
    };
  }
}
