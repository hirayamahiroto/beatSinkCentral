import type { User, UserState } from "../entities";

export const createUserBehaviors = (state: UserState): User => ({
  toJSON: () => ({
    subId: state.subId.value,
    email: state.email.value,
  }),
});
