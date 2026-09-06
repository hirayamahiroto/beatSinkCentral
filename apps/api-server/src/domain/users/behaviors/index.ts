import type { User, UserState } from "../entities";
import type { Email } from "../valueObjects/email";

export const createUserBehaviors = (state: UserState): User => ({
  getId: () => state.id,
  getSub: () => state.subId.value,
  getEmail: () => state.email.value,
  changeEmail: (newEmail: Email) =>
    createUserBehaviors({
      ...state,
      email: newEmail,
    }),
  toPersistence: () => ({
    id: state.id,
    subId: state.subId.value,
    email: state.email.value,
  }),
});
