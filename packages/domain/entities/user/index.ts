import { v4 as uuidv4 } from "uuid";
import { Role } from "../Role";

type UserJson = {
  id: string;
  email: string;
  password: string;
  role: Role;
};

type CreateUserParams = {
  email: string;
  password: string;
  role: Role;
};

type RestoreUserParams = {
  id: string;
  email: string;
  password: string;
  role: Role;
};

export class User {
  private _id: string;
  private _email: string;
  private _password: string;
  private _role: Role;

  private constructor(id: string, email: string, password: string, role: Role) {
    this._id = id;
    this._email = email;
    this._password = password;
    this._role = role;
  }

  // 新規ユーザー作成用のファクトリーメソッド
  public static create(params: CreateUserParams): User {
    const id = uuidv4();
    return new User(id, params.email, params.password, params.role);
  }

  // DBから復元する場合のファクトリーメソッド
  public static restore(params: RestoreUserParams): User {
    return new User(params.id, params.email, params.password, params.role);
  }

  // JSONから復元
  public static fromJson(json: UserJson): User {
    return new User(json.id, json.email, json.password, json.role);
  }

  // インスタンスメソッドとしてtoJsonを実装
  public toJson(): UserJson {
    return {
      id: this._id,
      email: this._email,
      password: this._password,
      role: this._role,
    };
  }

  // ゲッター（必要に応じて）
  public get id(): string {
    return this._id;
  }

  public get email(): string {
    return this._email;
  }

  public get role(): Role {
    return this._role;
  }
}