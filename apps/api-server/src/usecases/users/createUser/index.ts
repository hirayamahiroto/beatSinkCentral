import {
  registerNewUser,
  type RegisterNewUserError,
} from "../../../domain/services/userRegistration";
import type { RegistrationCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

export type CreateUserInput = {
  subId: string;
  email: string;
  handle: string;
};

export type CreateUserOutput = {
  userId: string;
  artistId: string;
};

export type CreateUserError = RegisterNewUserError;

type CreateUserCaps = Pick<RegistrationCapabilities, "users" | "artists">;

export const createUser = async (
  caps: CreateUserCaps,
  input: CreateUserInput,
): Promise<Result<CreateUserOutput, CreateUserError>> => {
  const [userIfRegistered, artistIfHandleTaken] = await Promise.all([
    caps.users.findBySub(input.subId),
    caps.artists.findByHandle(input.handle),
  ]);

  const registered = registerNewUser(
    input,
    userIfRegistered,
    artistIfHandleTaken,
  );
  if (!registered.ok) return registered;

  const { user, artist } = registered.value;
  await caps.users.save(user.toPersistence());
  await caps.artists.save(artist.toPersistence());

  return ok({
    userId: user.getId(),
    artistId: artist.getArtistId(),
  });
};
