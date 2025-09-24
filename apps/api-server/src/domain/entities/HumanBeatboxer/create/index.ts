import { HumanBeatboxerProfile, HumanBeatboxer } from "../types";

export const createHumanBeatboxer = (
  id: string,
  userId: string,
  profileId: string,
  profile: HumanBeatboxerProfile
): HumanBeatboxer => ({
  id,
  userId,
  profileId,
  profile,
  createdAt: new Date(),
});
