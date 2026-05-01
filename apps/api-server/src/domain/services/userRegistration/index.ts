import { createUser } from "../../users/factories";
import { createArtist } from "../../artists/factories";
import type { User } from "../../users/entities";
import type { Artist } from "../../artists/entities";
import { assertNotRegistered } from "../../users/policies/assertNotRegistered";
import { assertAccountIdAvailable } from "../../artists/policies/assertAccountIdAvailable";

export type RegisterNewUserInput = {
  subId: string;
  email: string;
  accountId: string;
};

export type RegisterNewUserResult = {
  user: User;
  artist: Artist;
};

export const registerNewUser = (
  input: RegisterNewUserInput,
  userIfRegistered: User | null,
  artistIfAccountIdTaken: Artist | null,
): RegisterNewUserResult => {
  assertNotRegistered(userIfRegistered);
  assertAccountIdAvailable(artistIfAccountIdTaken);

  const user = createUser({
    subId: input.subId,
    email: input.email,
  });

  const artist = createArtist({
    accountId: input.accountId,
    ownerUserId: user.getId(),
  });

  return { user, artist };
};
