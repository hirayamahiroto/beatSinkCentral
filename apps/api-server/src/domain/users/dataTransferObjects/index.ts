export interface CreateUserDto {
  auth0UserId: string;
  email: string;
  username: string;
  attributes?: Record<string, unknown>;
}
