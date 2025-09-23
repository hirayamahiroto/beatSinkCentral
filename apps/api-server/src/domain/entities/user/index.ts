import { Email, createEmail, emailToJson, UserId } from "../../valueObjects";

export interface User {
  readonly id: UserId;
  readonly email: Email;
  readonly password: string;
}

export const createUser = (email: string, password: string): User => ({
  id: UserId.generate(),
  email: createEmail(email),
  password,
});

export const userToJson = (user: User) => ({
  id: user.id.toJSON(),
  email: emailToJson(user.email),
});
