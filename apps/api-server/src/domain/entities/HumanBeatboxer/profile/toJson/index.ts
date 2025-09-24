import { HumanBeatboxerProfile } from "../../types";

export const humanBeatboxerProfileToJson = (
  profile: HumanBeatboxerProfile
) => ({
  id: profile.id,
  artistName: profile.artistName,
  age: profile.age,
  sex: profile.sex,
  createdAt: profile.createdAt.toISOString(),
  updatedAt: profile.updatedAt.toISOString(),
});
