import { notFound } from "next/navigation";
import { getPlayerDetail } from "../../../fetchers/players/getPlayerDetail";
import { resolveProfileViewFrom } from "../../../libs/analytics/profileViewFrom";
import { PlayerDetailClientAdapter } from "./PlayerDetailClientAdapter";

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PlayerDetailPage({
  params,
  searchParams,
}: Props) {
  const [{ handle }, { from }] = await Promise.all([params, searchParams]);
  const result = await getPlayerDetail({ handle });

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
          artistId={player.artistId}
          profileViewFrom={resolveProfileViewFrom(from)}
          name={player.name}
          tagline={player.tagline}
          imageUrl={player.imageUrl}
          genres={player.genres}
          storyChapters={player.storyChapters}
          translation={player.translation}
          listeningPoint={player.listeningPoint}
          offer={player.offer}
          supportLinks={player.supportLinks}
        />
      </div>
    </div>
  );
}
