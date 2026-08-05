import { createUser, type UserFieldError } from "../../users/factories";
import { createArtist, type ArtistFieldError } from "../../artists/factories";
import type { User } from "../../users/entities";
import type { Artist } from "../../artists/entities";
import {
  createUserAlreadyRegisteredError,
  type UserAlreadyRegisteredError,
} from "../../users/errors/userAlreadyRegistered";
import {
  createAccountIdAlreadyTakenError,
  type AccountIdAlreadyTakenError,
} from "../../artists/errors/accountIdAlreadyTaken";
import { type Result, err, map } from "../../../utils/result";

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
  | UserFieldError
  | ArtistFieldError;

export const registerNewUser = (
  input: RegisterNewUserInput,
  userIfRegistered: User | null,
  artistIfAccountIdTaken: Artist | null,
): Result<RegisterNewUserResult, RegisterNewUserError> => {
  if (userIfRegistered) return err(createUserAlreadyRegisteredError());
  if (artistIfAccountIdTaken) {
    return err(
      createAccountIdAlreadyTakenError(artistIfAccountIdTaken.getAccountId()),
    );
  }

  const user = createUser({
    subId: input.subId,
    email: input.email,
  });
  if (!user.ok) return user;

  return map(
    createArtist({
      accountId: input.accountId,
      ownerUserId: user.value.getId(),
    }),
    (artist) => ({ user: user.value, artist }),
  );
};
