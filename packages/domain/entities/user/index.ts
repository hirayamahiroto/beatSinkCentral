import { v4 as uuidv4 } from "uuid";
import { Role } from "../Role";

type UserJson = {
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

  constructor(email: string, password: string, role: Role) {
    this._id = uuidv4();
    this._email = email;
    this._password = password;
    this._role = role;
  }

  public toJson(user: User): UserJson {
    return {
      id: user._id,
      email: user._email,
      password: user._password,
      role: user._role,
    };
  }
}
