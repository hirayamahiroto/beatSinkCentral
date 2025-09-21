interface UserProps {
  id: string;
  email: string;
  password: string;
}

export class User {
  readonly id: string;
  email: string;
  password: string;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.password = props.password;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
    };
  }
}
