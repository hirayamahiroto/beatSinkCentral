export interface HumanBeatboxerProfile {
  readonly id: string;
  readonly artistName: string;
  readonly age: number;
  readonly sex: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface HumanBeatboxer {
  readonly id: string;
  readonly userId: string;
  readonly profileId: string;
  readonly profile: HumanBeatboxerProfile;
  readonly createdAt: Date;
}
