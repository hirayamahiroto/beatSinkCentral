import { HumanBeatboxerProfile } from "../../types";

export const createHumanBeatboxerProfile = (
  id: string,
  artistName: string,
  age: number,
  sex: string
): HumanBeatboxerProfile => ({
  id,
  artistName,
  age,
  sex,
  createdAt: new Date(),
  updatedAt: new Date(),
});
