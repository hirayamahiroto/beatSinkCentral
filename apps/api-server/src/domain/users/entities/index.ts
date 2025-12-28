import { createEmail } from "../../valueObjects/Email";

type CreateUserParams = {
  id: string;
  auth0UserId: string;
  email: string;
  username: string;
  attributes?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
};

type PublicProfile = {
  id: string;
  auth0UserId: string;
  email: string;
  username: string;
};

export class User {
  private constructor(
    private readonly _id: string,
    private readonly _auth0UserId: string,
    private _email: string,
    private _username: string,
    private _attributes: Record<string, unknown>,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  public static create(params: CreateUserParams): User {
    const now = new Date();
    const createdAt = params.createdAt ?? now;
    const updatedAt = params.updatedAt ?? now;

    User.ensureAuth0UserId(params.auth0UserId);
    User.ensureUsername(params.username);
    User.ensureEmail(params.email);
    User.ensureTimestamps(createdAt, updatedAt);

    return new User(
      params.id,
      params.auth0UserId,
      params.email,
      params.username,
      params.attributes ?? {},
      createdAt,
      updatedAt
    );
  }

  public static reconstitute(params: CreateUserParams): User {
    return User.create(params);
  }

  public toPublicProfile(): PublicProfile {
    return {
      id: this._id,
      auth0UserId: this._auth0UserId,
      email: this._email,
      username: this._username,
    };
  }

  private static ensureAuth0UserId(auth0UserId: string): void {
    if (!auth0UserId || auth0UserId.trim().length === 0) {
      throw new Error("auth0UserId is required");
    }
  }

  private static ensureUsername(username: string): void {
    if (!username || username.trim().length === 0) {
      throw new Error("username is required");
    }
    if (username.length > 255) {
      throw new Error("username must be 255 characters or less");
    }
  }

  private static ensureEmail(email: string): void {
    // reuse value object validation to enforce format
    createEmail(email);
  }

  private static ensureTimestamps(createdAt: Date, updatedAt: Date): void {
    if (
      Number.isNaN(createdAt.getTime()) ||
      Number.isNaN(updatedAt.getTime())
    ) {
      throw new Error("createdAt/updatedAt must be valid dates");
    }
    if (updatedAt.getTime() < createdAt.getTime()) {
      throw new Error("updatedAt cannot be earlier than createdAt");
    }
  }
}
