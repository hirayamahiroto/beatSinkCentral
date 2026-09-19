"use client";

import {
  ArtistImmersiveProfile,
  type ImmersiveArtist,
  type ImmersivePatternCode,
} from "@ui/design-system/components/organisms/ArtistImmersiveProfile";

type Props = {
  pattern: ImmersivePatternCode;
  artist: ImmersiveArtist;
};

export const PlayerConceptClientAdapter = ({ pattern, artist }: Props) => (
  <ArtistImmersiveProfile
    pattern={pattern}
    artist={artist}
    onLinkClick={() => {}}
  />
);
