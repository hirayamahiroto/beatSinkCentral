import type { Sub } from "../valueObjects/sub";
import type { Email } from "../valueObjects/email";

// 内部状態の型
export type UserState = {
  readonly subId: Sub;
  readonly email: Email;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

// 振る舞いの契約
export type User = {
  toJSON: () => {
    subId: string;
    email: string;
  };
};
