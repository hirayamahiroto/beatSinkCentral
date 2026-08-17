import type { IUserReader } from "../../../domain/users/repositories";
import type { IArtistReader } from "../../../domain/artists/repositories";
import type { ActorResolution } from "../../../usecases/capabilities";

export type ActorStateReaders = {
  users: IUserReader;
  artists: IArtistReader;
};

export const resolveActorState = async (
  readers: ActorStateReaders,
  subId: string,
): Promise<ActorResolution> => {
  const user = await readers.users.findBySub(subId);
  if (!user) return { status: "unregistered" };

  const artist = await readers.artists.findByUserId(user.getId());
  if (!artist) return { status: "userOnly", user };

  return { status: "complete", actor: { user, artist } };
};
