import { HumanBeatboxer } from "../types";

export const humanBeatboxerToJson = (humanBeatboxer: HumanBeatboxer) => ({
  id: humanBeatboxer.id,
  userId: humanBeatboxer.userId,
  profileId: humanBeatboxer.profileId,
  profile: {
    id: humanBeatboxer.profile.id,
    artistName: humanBeatboxer.profile.artistName,
    age: humanBeatboxer.profile.age,
    sex: humanBeatboxer.profile.sex,
    createdAt: humanBeatboxer.profile.createdAt.toISOString(),
    updatedAt: humanBeatboxer.profile.updatedAt.toISOString(),
  },
  createdAt: humanBeatboxer.createdAt.toISOString(),
});