import { notFound } from "next/navigation";
import { createBeatfolioBffServerClient } from "../../../utils/client";
import { PublicArtistProfileClientAdapter } from "./PublicArtistProfileClientAdapter";

type Props = {
  params: Promise<{ accountId: string }>;
};

export default async function PlayerDetailPage({ params }: Props) {
  const { accountId } = await params;

  const client = createBeatfolioBffServerClient();
  const res = await client.api.players[":accountId"].$get({
    param: { accountId },
  });

  if (!res.ok) {
    notFound();
  }

  const profile = await res.json();

  if (!profile.name) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 pb-16 pt-24">
      <div className="container mx-auto max-w-2xl">
        <PublicArtistProfileClientAdapter
          name={profile.name}
          tagline={profile.tagline}
          imageUrl={profile.imageUrl}
          story={profile.story}
          activityInfo={profile.activityInfo}
          genres={profile.genres}
          links={profile.links}
        />
      </div>
    </div>
  );
}
