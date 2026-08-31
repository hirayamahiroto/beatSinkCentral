import { createUser, type UserFieldError } from "../../users/factories";
import { createArtist, type ArtistFieldError } from "../../artists/factories";
import type { User } from "../../users/entities";
import type { Artist } from "../../artists/entities";
import {
  createUserAlreadyRegisteredError,
  type UserAlreadyRegisteredError,
} from "../../users/errors/userAlreadyRegistered";
import {
  createHandleAlreadyTakenError,
  type HandleAlreadyTakenError,
} from "../../artists/errors/handleAlreadyTaken";
import { type Result, err, map } from "../../../utils/result";

export type RegisterNewUserInput = {
  subId: string;
  email: string;
  handle: string;
};

export type RegisterNewUserResult = {
  user: User;
  artist: Artist;
};

export type RegisterNewUserError =
  | UserAlreadyRegisteredError
  | HandleAlreadyTakenError
  | UserFieldError
  | ArtistFieldError;

export const registerNewUser = (
  input: RegisterNewUserInput,
  userIfRegistered: User | null,
  artistIfHandleTaken: Artist | null,
): Result<RegisterNewUserResult, RegisterNewUserError> => {
  if (userIfRegistered) return err(createUserAlreadyRegisteredError());
  if (artistIfHandleTaken) {
    return err(createHandleAlreadyTakenError(artistIfHandleTaken.getHandle()));
  }

  const user = createUser({
    subId: input.subId,
    email: input.email,
  });
  if (!user.ok) return user;

  return map(
    createArtist({
      handle: input.handle,
      ownerUserId: user.value.getId(),
    }),
    (artist) => ({ user: user.value, artist }),
  );
};
