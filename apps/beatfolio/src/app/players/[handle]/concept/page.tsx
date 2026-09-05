import { notFound } from "next/navigation";
import { getPlayerConcept } from "../../../../fetchers/players/getPlayerConcept";
import { PlayerConceptClientAdapter } from "./PlayerConceptClientAdapter";

type Props = {
  params: Promise<{ handle: string }>;
};

export default async function PlayerConceptPage({ params }: Props) {
  const { handle } = await params;
  const result = await getPlayerConcept({ handle });

  if (!result.ok) {
    if (result.error.kind === "notFound") {
      notFound();
    }
    throw new Error(result.error.message);
  }

  const concept = result.value;

  return (
    <PlayerConceptClientAdapter
      pattern={concept.patternCode}
      artist={{
        name: concept.name,
        tagline: concept.tagline,
        heroImageUrl: concept.heroImageUrl,
        genres: concept.genres,
        activityInfo: concept.activityInfo,
        chapters: concept.chapters,
        links: concept.links,
        primaryAction: concept.primaryAction,
      }}
    />
  );
}
