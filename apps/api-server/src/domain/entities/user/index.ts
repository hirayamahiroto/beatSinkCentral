import { Email, UserId } from "../../valueObjects";

interface UserProps {
  id: UserId;
  email: Email;
  password: string;
}

export class User {
  readonly id: UserId;
  email: Email;
  password: string;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.password = props.password;
  }

  static create(email: string, password: string): User {
    return new User({
      id: UserId.generate(),
      email: new Email(email),
      password: password,
    });
  }

  toJSON() {
    return {
      id: this.id.toJSON(),
      email: this.email.toJSON(),
    };
  }
}
