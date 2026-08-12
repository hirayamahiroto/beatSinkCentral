import { User } from "../entities";

export type UserSaveData = {
  id: string;
  subId: string;
  email: string;
};

export type UserUpdateEmailData = {
  id: string;
  email: string;
};

export interface IUserReader {
  findBySub(sub: string): Promise<User | null>;
}

export interface IUserWriter {
  save(data: UserSaveData): Promise<User>;
  updateEmail(data: UserUpdateEmailData): Promise<User>;
}
