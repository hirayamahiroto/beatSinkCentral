import { createSub } from "../valueObjects/sub";
import { createEmail } from "../valueObjects/email";
import { createUserBehaviors } from "../behaviors";
import type { User } from "../entities";

// 新規作成用
export type CreateUserParams = {
  subId: string;
  email: string;
};

export const createUser = (params: CreateUserParams): User => {
  const now = new Date();
  const state = {
    subId: createSub(params.subId),
    email: createEmail(params.email),
    createdAt: now,
    updatedAt: now,
  };

  return createUserBehaviors(state);
};
