import { User } from "../../../entities/user";
import {
  IUserRepository,
  CreateUserDto,
} from "../../../repositories/IUserRepository";

export interface RegisterUserInput {
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
 * 機能:
 * - ユーザーを新規登録
 * - 登録時点ではアーティストではない
 */
export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // メールアドレスの重複チェック
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error(`User with email ${input.email} already exists`);
    }

    // ユーザーを作成
    const createDto: CreateUserDto = {
      email: input.email,
      username: input.username,
      attributes: input.attributes || {},
    };

    const user = await this.userRepository.create(createDto);
    console.log("user-------", user);
    // 登録時点ではアーティストではない
    return {
      user,
      isArtist: false,
    };
  }
}
