import { User } from "../../../../entities/user";
import { HumanBeatboxer } from "../../../../entities/roles/humanBeatboxer";
import { HumanBeatboxerProfile } from "../../../../entities/profiles/humanBeatboxerProfile";
import { Email, UserId } from "../../../../valueObjects";

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

  // Create entities with generated IDs
  const user = new User({
    id: new UserId(userId),
    email: new Email(request.email),
    password: request.password, // In production, hash the password
  });

  const profile = new HumanBeatboxerProfile({
    id: profileId,
    artistName: request.artistName,
    age: request.age,
    sex: request.sex,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const humanBeatboxer = new HumanBeatboxer({
    id: humanBeatboxerId,
    userId: userId,
    profileId: profileId,
    profile: profile,
  });

  storage.users.set(userId, user);
  storage.profiles.set(profileId, profile);
  storage.humanBeatboxers.set(humanBeatboxerId, humanBeatboxer);

  return {
    user,
    humanBeatboxer,
    profile,
  };
}
