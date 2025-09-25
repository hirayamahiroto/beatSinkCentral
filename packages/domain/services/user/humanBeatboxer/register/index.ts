import { User } from "../../../../entities/user";
import { Role } from "../../../../entities/Role";
import { createHumanBeatboxer } from "../../../../entities/HumanBeatboxer/create";
import { createHumanBeatboxerProfile } from "../../../../entities/HumanBeatboxer/profile/create";
import {
  HumanBeatboxer,
  HumanBeatboxerProfile,
} from "../../../../entities/HumanBeatboxer/types";

export interface RegisterRequest {
  email: string;
  password: string;
  artistName: string;
  age: number;
  sex: string;
}

export interface RegisterResponse {
  user: User;
  humanBeatboxer: HumanBeatboxer;
  profile: HumanBeatboxerProfile;
}

// Mock ID generation (in production, DB will generate these)
function mockDbGenerateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export async function register(
  request: RegisterRequest,
  storage: {
    users: Map<string, User>;
    humanBeatboxers: Map<string, HumanBeatboxer>;
    profiles: Map<string, HumanBeatboxerProfile>;
  }
): Promise<RegisterResponse> {
  // Generate IDs (mock DB behavior)
  const userId = mockDbGenerateId("user");
  const profileId = mockDbGenerateId("hbb_profile");
  const humanBeatboxerId = mockDbGenerateId("hbb");

  // Create entities using functional style
  const user = new User(
    request.email,
    request.password,
    new Role("humanBeatboxer")
  );

  const profile = createHumanBeatboxerProfile(
    profileId,
    request.artistName,
    request.age,
    request.sex
  );

  const humanBeatboxer = createHumanBeatboxer(
    humanBeatboxerId,
    userId,
    profileId,
    profile
  );

  // Store in memory (userId from generated user won't match mockDbGenerateId)
  // In production, DB would handle ID generation consistently
  storage.users.set(userId, user);
  storage.profiles.set(profileId, profile);
  storage.humanBeatboxers.set(humanBeatboxerId, humanBeatboxer);

  return {
    user,
    humanBeatboxer,
    profile,
  };
}
