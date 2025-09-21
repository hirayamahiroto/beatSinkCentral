import { HumanBeatboxerProfile } from "../../profiles/humanBeatboxerProfile";

export interface HumanBeatboxerProps {
  id: string;
  userId: string;
  profileId: string;
  profile: HumanBeatboxerProfile;
}

export class HumanBeatboxer {
  readonly id?: string;
  readonly userId?: string;
  profileId: string;

  profile: HumanBeatboxerProfile;

  constructor(props: HumanBeatboxerProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.profileId = props.profileId;
    this.profile = props.profile;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      profileId: this.profileId,
      profile: this.profile.toJSON(),
    };
  }
}
