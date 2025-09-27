import { Role } from "../../entities/Role";

export class RoleFactory {
  public static createAudience(): Role {
    return new Role("audience");
  }
}
