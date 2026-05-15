import type { User, UserState } from "../entities";
import { createEmail } from "../valueObjects/email";

export const createUserBehaviors = (state: UserState): User => ({
  getId: () => state.id,
  getSub: () => state.subId.value,
  getEmail: () => state.email.value,
  changeEmail: (newEmail: string) =>
    createUserBehaviors({
      ...state,
      email: createEmail(newEmail),
    }),
  toPersistence: () => ({
    id: state.id,
    subId: state.subId.value,
    email: state.email.value,
  }),
});
