import { notFound, redirect } from "next/navigation";
import { listPlayers } from "../../fetchers/players/listPlayers";
import { resolveReadFailure } from "../../views/resolveReadFailure";
import { DegradedScreen } from "../shared/DegradedScreen";
import { PlayersClientAdapter } from "./PlayersClientAdapter";

export default async function Players() {
  const result = await listPlayers();

  if (!result.ok) {
    const failure = resolveReadFailure(result.error);
    if (failure.kind === "redirect") redirect(failure.to);
    if (failure.kind === "notFound") notFound();

    return <DegradedScreen feedback={failure.feedback} />;
  }

  const { players } = result.value;

  return <PlayersClientAdapter players={players} />;
}
