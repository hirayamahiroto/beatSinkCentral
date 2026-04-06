import { createSub } from "../valueObjects/sub";
import { createEmail } from "../valueObjects/email";
import { createUserBehaviors } from "../behaviors";
import type { User } from "../entities";

export type CreateUserParams = {
  subId: string;
  email: string;
};

export const createUser = (params: CreateUserParams): User => {
  const state = {
    id: crypto.randomUUID(),
    subId: createSub(params.subId),
    email: createEmail(params.email),
  };

  return createUserBehaviors(state);
};

export type ReconstructUserParams = {
  id: string;
  subId: string;
  email: string;
};

export const reconstructUser = (params: ReconstructUserParams): User => {
  const state = {
    id: params.id,
    subId: createSub(params.subId),
    email: createEmail(params.email),
  };

  return createUserBehaviors(state);
};
