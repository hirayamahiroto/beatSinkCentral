export class UserId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error("Invalid UserId format");
    }
    this._value = value;
  }

  private isValid(id: string): boolean {
    const userIdRegex = /^user_\d+_[a-z0-9]{9}$/;
    return userIdRegex.test(id) && id.length >= 20 && id.length <= 50;
  }

  static generate(): UserId {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 11);
    return new UserId(`user_${timestamp}_${randomStr}`);
  }

  toJSON(): string {
    return this._value;
  }
}
