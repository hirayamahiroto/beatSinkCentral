import { User } from "../../../entities/user";
import { HumanBeatboxer } from "../../../entities/roles/humanBeatboxer";
import { HumanBeatboxerProfile } from "../../../entities/profiles/humanBeatboxerProfile";
import { register, RegisterRequest, RegisterResponse } from "./register";

export type { RegisterRequest };

export class UserService {
  private users: Map<string, User> = new Map();
  private humanBeatboxers: Map<string, HumanBeatboxer> = new Map();
  private profiles: Map<string, HumanBeatboxerProfile> = new Map();

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    return register(request, {
      users: this.users,
      humanBeatboxers: this.humanBeatboxers,
      profiles: this.profiles,
    });
  }
}
