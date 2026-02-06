import { createSub } from "../valueObjects/sub";
import { createEmail } from "../valueObjects/email";
import { createName } from "../valueObjects/name";
import { createUserBehaviors } from "../behaviors";
import type { User } from "../entities";

// 新規作成用
export type CreateUserParams = {
  accountId: string;
  sub: string;
  email: string;
  name: string;
};

export const createUser = (params: CreateUserParams): User => {
  const now = new Date();
  const state = {
    accountId: params.accountId,
    sub: createSub(params.sub),
    email: createEmail(params.email),
    name: createName(params.name),
    createdAt: now,
    updatedAt: now,
  };

  return createUserBehaviors(state);
};
