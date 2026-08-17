import { createSub, type InvalidSubFormatError } from "../valueObjects/sub";
import {
  createEmail,
  type InvalidEmailFormatError,
} from "../valueObjects/email";
import { createUserBehaviors } from "../behaviors";
import type { User, UserState } from "../entities";
import { type Result, map, all, unwrapOrThrow } from "../../../utils/result";

export type UserFieldError = InvalidSubFormatError | InvalidEmailFormatError;

type UserFields = {
  subId: string;
  email: string;
};

const buildState = (
  id: string,
  fields: UserFields,
): Result<UserState, UserFieldError> =>
  map(
    all({
      subId: createSub(fields.subId),
      email: createEmail(fields.email),
    }),
    (values) => ({ id, ...values }),
  );

export type CreateUserParams = UserFields;

export const createUser = (
  params: CreateUserParams,
): Result<User, UserFieldError> =>
  map(buildState(crypto.randomUUID(), params), createUserBehaviors);

export type ReconstructUserParams = UserFields & {
  id: string;
};

export const reconstructUser = (params: ReconstructUserParams): User =>
  unwrapOrThrow(
    map(buildState(params.id, params), createUserBehaviors),
    "reconstructUser: stored user has invalid field values",
  );
