import { createAuth0UserId } from "../valueObjects/Auth0UserId";
import { createEmail } from "../valueObjects/Email";
import { createUsername } from "../valueObjects/Username";

export type User = {
  readonly auth0UserId: string;
  readonly email: string;
  readonly username: string;
  readonly attributes: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

type CreateUserParams = {
  auth0UserId: string;
  email: string;
  username: string;
  attributes?: Record<string, unknown>;
};

export const createUser = (params: CreateUserParams): User => {
  const auth0UserId = createAuth0UserId(params.auth0UserId);
  const username = createUsername(params.username);
  const email = createEmail(params.email);
  const now = new Date();

  return {
    auth0UserId: auth0UserId.value,
    email: email.value,
    username: username.value,
    attributes: params.attributes ?? {},
    createdAt: now,
    updatedAt: now,
  };
};
