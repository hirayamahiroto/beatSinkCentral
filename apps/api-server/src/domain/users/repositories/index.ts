import { User } from "../entities";
import type { TransactionContext } from "../../../infrastructure/transaction";

export type UserSaveData = {
  id: string;
  subId: string;
  email: string;
};

export type UserUpdateEmailData = {
  id: string;
  email: string;
};

export interface IUserRepository {
  save(data: UserSaveData, tx?: TransactionContext): Promise<User>;
  findBySub(sub: string, tx?: TransactionContext): Promise<User | null>;
  updateEmail(
    data: UserUpdateEmailData,
    tx?: TransactionContext,
  ): Promise<User>;
}
