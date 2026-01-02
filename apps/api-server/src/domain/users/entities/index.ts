import { createSub } from "../valueObjects/sub";
import { createEmail } from "../valueObjects/email";
import { createName } from "../valueObjects/name";

export type User = {
  readonly accountId: string;
  readonly sub: string;
  readonly email: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

type CreateUserParams = {
  accountId: string;
  sub: string;
  email: string;
  name: string;
};

/**
 * 新規ユーザーEntity生成（バリデーション実行、日時自動生成）
 */
export const createUser = (params: CreateUserParams): User => {
  const sub = createSub(params.sub);
  const name = createName(params.name);
  const email = createEmail(params.email);
  const now = new Date();

  return {
    accountId: params.accountId,
    sub: sub.value,
    email: email.value,
    name: name.value,
    createdAt: now,
    updatedAt: now,
  };
};
