import { listPlayers } from "../../fetchers/players/listPlayers";
import { PlayersClientAdapter } from "./PlayersClientAdapter";

export default async function Players() {
  const result = await listPlayers();

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  const { players } = result.value;

  return <PlayersClientAdapter players={players} />;
}
