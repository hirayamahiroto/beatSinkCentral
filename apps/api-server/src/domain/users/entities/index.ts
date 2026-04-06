import type { Sub } from "../valueObjects/sub";
import type { Email } from "../valueObjects/email";

export type UserState = {
  readonly id: string;
  readonly subId: Sub;
  readonly email: Email;
};

export type User = {
  getId: () => string;
  getSub: () => string;
  getEmail: () => string;
  toPersistence: () => {
    id: string;
    subId: string;
    email: string;
  };
};
