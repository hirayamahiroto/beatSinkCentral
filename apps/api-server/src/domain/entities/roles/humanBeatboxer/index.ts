import { HumanBeatboxerProfile, humanBeatboxerProfileToJson } from "../../profiles/humanBeatboxerProfile";

export interface HumanBeatboxer {
  readonly id: string;
  readonly userId: string;
  readonly profileId: string;
  readonly profile: HumanBeatboxerProfile;
  readonly createdAt: Date;
}

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

export const humanBeatboxerToJson = (hbb: HumanBeatboxer) => ({
  id: hbb.id,
  userId: hbb.userId,
  profileId: hbb.profileId,
  profile: humanBeatboxerProfileToJson(hbb.profile),
  createdAt: hbb.createdAt.toISOString(),
});