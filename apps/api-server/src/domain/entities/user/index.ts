export class User {
  constructor(
    public readonly id: string,
    public readonly auth0UserId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly attributes: Record<string, unknown>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
