import { User } from "../../../entities/user";
import { UserFactory } from "../../../factories/User";
import { RoleFactory } from "../../../factories/Role";

export type RegisterRequest = {
  email: string;
  password: string;
};

export type RegisterResponse = {
  user: User;
};

export const audienceRegister = async (
  request: RegisterRequest
): Promise<RegisterResponse> => {
  const user = UserFactory.register({
    email: request.email,
    password: request.password,
    role: RoleFactory.createAudience(),
  });

  // DBへの保存
  // 保存処理可否の判定
  // 保存処理の実行
  // 保存処理の結果を返す
  // 保存できなかったらerrorを返す。

  return {
    user,
  };
};
