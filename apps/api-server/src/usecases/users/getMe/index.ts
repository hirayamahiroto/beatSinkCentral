import type { IUserRepository } from "../../../domain/users/repositories";
import type { IArtistRepository } from "../../../domain/artists/repositories";

type GetMeResultNotRegistered = {
  registered: false;
};

type GetMeResultRegistered = {
  registered: true;
  userId: string;
  email: string;
  artist: {
    artistId: string;
    accountId: string;
    hasProfile: boolean;
  } | null;
};

export type GetMeResult = GetMeResultNotRegistered | GetMeResultRegistered;

export const getMeUseCase = async (
  sub: string,
  userRepository: IUserRepository,
  artistRepository: IArtistRepository
): Promise<GetMeResult> => {
  const user = await userRepository.findBySub(sub);

  if (!user) {
    return { registered: false };
  }

  const artist = await artistRepository.findByUserId(user.getId());

  return {
    registered: true,
    userId: user.getId(),
    email: user.getEmail(),
    artist: artist
      ? {
          artistId: artist.getArtistId(),
          accountId: artist.getAccountId(),
          hasProfile: artist.hasProfile(),
        }
      : null,
  };
};
