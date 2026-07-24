import type { Sub } from "../valueObjects/sub";
import type { Email } from "../valueObjects/email";

export type UnregisteredUser = {
  readonly status: "unregistered";
  readonly sub: Sub;
  readonly email: Email;
};

export type RegisteredUser = {
  readonly status: "registered";
  readonly id: string;
  readonly sub: Sub;
  readonly email: Email;
};

export type User = UnregisteredUser | RegisteredUser;
