import { notFound } from "next/navigation";
import { getPlayerDetail } from "../../../fetchers/players/getPlayerDetail";
import { PlayerDetailClientAdapter } from "./PlayerDetailClientAdapter";

type Props = {
  params: Promise<{ accountId: string }>;
};

export default async function PlayerDetailPage({ params }: Props) {
  const { accountId } = await params;
  const result = await getPlayerDetail({ accountId });

  if (!result.ok) {
    if (result.error.kind === "notFound") {
      notFound();
    }
    throw new Error(result.error.message);
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
