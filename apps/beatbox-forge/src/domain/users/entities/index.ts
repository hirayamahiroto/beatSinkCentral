import type { Sub } from "../valueObjects/sub";
import type { Email } from "../valueObjects/email";
import type { Name } from "../valueObjects/name";

// 内部状態の型
export type UserState = {
  readonly accountId: string;
  readonly sub: Sub;
  readonly email: Email;
  readonly name: Name;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

// 振る舞いの契約
export type User = {
  toJSON: () => {
    accountId: string;
    sub: string;
    email: string;
    name: string;
  };
};
