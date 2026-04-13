import type { IUserRepository } from "../../../domain/users/repositories";
import type { IArtistRepository } from "../../../domain/artists/repositories";

export type GetMeInput = {
  subId: string;
};

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

export type GetMeDeps = {
  userRepository: IUserRepository;
  artistRepository: IArtistRepository;
};

export const getMeUseCase = async (
  input: GetMeInput,
  deps: GetMeDeps
): Promise<GetMeResult> => {
  const user = await deps.userRepository.findBySub(input.subId);

  if (!user) {
    return { registered: false };
  }

  const artist = await deps.artistRepository.findByUserId(user.getId());

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
