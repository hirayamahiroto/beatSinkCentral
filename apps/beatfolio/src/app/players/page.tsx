import { createBeatfolioBffServerClient } from "../../utils/client";
import { PlayersClientAdapter } from "./PlayersClientAdapter";

export default async function Players() {
  const client = createBeatfolioBffServerClient();
  const res = await client.api.players.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch players");
  }

  const { players } = await res.json();

  return <PlayersClientAdapter players={players} />;
}
