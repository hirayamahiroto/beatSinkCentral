export interface HumanBeatboxerProfileProps {
  id: string;
  artistName: string;
  age: number;
  sex: string;
  createdAt: Date;
  updatedAt: Date;
}

export class HumanBeatboxerProfile {
  readonly id: string;
  artistName: string;
  age: number;
  sex: string;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: HumanBeatboxerProfileProps) {
    this.id = props.id;
    this.artistName = props.artistName;
    this.age = props.age;
    this.sex = props.sex;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      artistName: this.artistName,
      age: this.age,
      sex: this.sex,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
