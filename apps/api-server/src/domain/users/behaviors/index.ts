import type { User, UserState } from "../entities";

export const createUserBehaviors = (state: UserState): User => ({
  getId: () => state.id,
  getSub: () => state.subId.value,
  getEmail: () => state.email.value,
  toPersistence: () => ({
    id: state.id,
    subId: state.subId.value,
    email: state.email.value,
  }),
});
