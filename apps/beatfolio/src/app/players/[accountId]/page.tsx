import { notFound, redirect } from "next/navigation";
import { getPlayerDetail } from "../../../fetchers/players/getPlayerDetail";
import { resolveReadFailure } from "../../../views/resolveReadFailure";
import { DegradedScreen } from "../../shared/DegradedScreen";
import { PlayerDetailClientAdapter } from "./PlayerDetailClientAdapter";

type Props = {
  params: Promise<{ accountId: string }>;
};

export default async function PlayerDetailPage({ params }: Props) {
  const { accountId } = await params;
  const result = await getPlayerDetail({ accountId });

  if (!result.ok) {
    const failure = resolveReadFailure(result.error);
    if (failure.kind === "redirect") redirect(failure.to);
    if (failure.kind === "notFound") notFound();

    return <DegradedScreen feedback={failure.feedback} />;
  }

  const player = result.value;

  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-24 text-foreground">
      <div className="container mx-auto max-w-3xl">
        <PlayerDetailClientAdapter
          name={player.name}
          tagline={player.tagline}
          imageUrl={player.imageUrl}
          story={player.story}
          activityInfo={player.activityInfo}
          genres={player.genres}
          links={player.links}
        />
      </div>
    </div>
  );
}
