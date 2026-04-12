import { createUser } from "../../users/factories";
import { createArtist } from "../../artists/factories";
import { createArtistOwner } from "../../artistOwners/factories";
import type { User } from "../../users/entities";
import type { Artist } from "../../artists/entities";
import type { ArtistOwner } from "../../artistOwners/entities";

export type RegisterNewUserInput = {
  subId: string;
  email: string;
  accountId: string;
};

export type RegisterNewUserResult = {
  user: User;
  artist: Artist;
  owner: ArtistOwner;
};

export const registerNewUser = (
  input: RegisterNewUserInput
): RegisterNewUserResult => {
  const user = createUser({
    subId: input.subId,
    email: input.email,
  });

  const artist = createArtist({
    accountId: input.accountId,
  });

  const owner = createArtistOwner({
    userId: user.getId(),
    artistId: artist.getArtistId(),
  });

  return { user, artist, owner };
};
