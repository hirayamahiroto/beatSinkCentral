export interface HumanBeatboxerProfile {
  readonly id: string;
  readonly artistName: string;
  readonly age: number;
  readonly sex: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const createHumanBeatboxerProfile = (
  id: string,
  artistName: string,
  age: number,
  sex: string
): HumanBeatboxerProfile => ({
  id,
  artistName,
  age,
  sex,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const humanBeatboxerProfileToJson = (profile: HumanBeatboxerProfile) => ({
  id: profile.id,
  artistName: profile.artistName,
  age: profile.age,
  sex: profile.sex,
  createdAt: profile.createdAt.toISOString(),
  updatedAt: profile.updatedAt.toISOString(),
});