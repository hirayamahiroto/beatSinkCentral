import { User } from "../entities";

export type UserSaveData = {
  id: string;
  subId: string;
  email: string;
};

export interface IUserRepository {
  save(data: UserSaveData): Promise<User>;
  findBySub(sub: string): Promise<User | null>;
}
