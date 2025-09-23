import { Email, createEmail, emailToJson, UserId, generateUserId, userIdToJson } from "../../valueObjects";

export interface User {
  readonly id: UserId;
  readonly email: Email;
  readonly password: string;
}

export const createUser = (email: string, password: string): User => ({
  id: generateUserId(),
  email: createEmail(email),
  password,
});

export const userToJson = (user: User) => ({
  id: userIdToJson(user.id),
  email: emailToJson(user.email),
});
