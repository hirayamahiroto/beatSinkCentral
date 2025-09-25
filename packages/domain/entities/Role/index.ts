type RoleName = "audience" | "humanBeatboxer" | "organizer";

export class Role {
  private _name: RoleName;

  constructor(name: RoleName) {
    this._name = name;
  }

  public toJson(role: RoleName): RoleName {
    return role;
  }
}
