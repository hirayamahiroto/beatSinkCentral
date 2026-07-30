import { type Result, err, flatMap, map } from "../../../utils/result";
import { createUser, type CreateUserError } from "../../users/factories";
import { createArtist, type CreateArtistError } from "../../artists/factories";
import type { User } from "../../users/entities";
import type { Artist } from "../../artists/entities";
import {
  createUserAlreadyRegisteredError,
  type UserAlreadyRegisteredError,
} from "../../users/policies/assertNotRegistered";
import {
  createAccountIdAlreadyTakenError,
  type AccountIdAlreadyTakenError,
} from "../../artists/policies/assertAccountIdAvailable";

export type RegisterNewUserInput = {
  subId: string;
  email: string;
  accountId: string;
};

export type RegisterNewUserResult = {
  user: User;
  artist: Artist;
};

export type RegisterNewUserError =
  | UserAlreadyRegisteredError
  | AccountIdAlreadyTakenError
  | CreateUserError
  | CreateArtistError;

export const registerNewUser = (
  input: RegisterNewUserInput,
  userIfRegistered: User | null,
  artistIfAccountIdTaken: Artist | null,
): Result<RegisterNewUserResult, RegisterNewUserError> => {
  if (userIfRegistered) {
    return err(createUserAlreadyRegisteredError());
  }
  if (artistIfAccountIdTaken) {
    return err(
      createAccountIdAlreadyTakenError(artistIfAccountIdTaken.getAccountId()),
    );
  }

  return flatMap(
    createUser({ subId: input.subId, email: input.email }),
    (user) =>
      map(
        createArtist({ accountId: input.accountId, ownerUserId: user.getId() }),
        (artist) => ({ user, artist }),
      ),
  );
};
