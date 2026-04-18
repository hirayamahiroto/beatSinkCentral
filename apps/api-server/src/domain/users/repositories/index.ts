import { User } from "../entities";
import type { TransactionContext } from "../../../infrastructure/transaction";

export type UserSaveData = {
  id: string;
  subId: string;
  email: string;
};

export interface IUserRepository {
  save(data: UserSaveData, tx?: TransactionContext): Promise<User>;
  findBySub(sub: string): Promise<User | null>;
}
