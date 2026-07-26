import { createSub, type InvalidSubFormatError } from "../valueObjects/sub";
import {
  createEmail,
  type InvalidEmailFormatError,
} from "../valueObjects/email";
import { createUserBehaviors } from "../behaviors";
import type { User } from "../entities";
import {
  type Result,
  flatMap,
  map,
  unwrapOrThrow,
} from "../../../utils/result";

export type CreateUserParams = {
  subId: string;
  email: string;
};

export type CreateUserError = InvalidSubFormatError | InvalidEmailFormatError;

export const createUser = (
  params: CreateUserParams,
): Result<User, CreateUserError> =>
  flatMap(createSub(params.subId), (subId) =>
    map(createEmail(params.email), (email) =>
      createUserBehaviors({ id: crypto.randomUUID(), subId, email }),
    ),
  );

export type ReconstructUserParams = {
  id: string;
  subId: string;
  email: string;
};

export const reconstructUser = (params: ReconstructUserParams): User => {
  const subId = unwrapOrThrow(
    createSub(params.subId),
    "reconstructUser: invalid subId in stored data",
  );
  const email = unwrapOrThrow(
    createEmail(params.email),
    "reconstructUser: invalid email in stored data",
  );

  return createUserBehaviors({ id: params.id, subId, email });
};
