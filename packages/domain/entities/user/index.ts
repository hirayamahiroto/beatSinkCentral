import { Role } from "../Role";

export class User {
  private _id: string;
  private _email: string;
  private _password: string;
  private _role: Role;

  public constructor(id: string, email: string, password: string, role: Role) {
    this._id = id;
    this._email = email;
    this._password = password;
    this._role = role;
  }
}
