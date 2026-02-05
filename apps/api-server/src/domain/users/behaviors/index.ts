import type { User, UserState } from "../entities";

export const createUserBehaviors = (state: UserState): User => ({
  toJSON: () => ({
    accountId: state.accountId,
    sub: state.sub.value,
    email: state.email.value,
    name: state.name.value,
    createdAt: state.createdAt.toISOString(),
    updatedAt: state.updatedAt.toISOString(),
  }),
});
