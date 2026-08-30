"use client";

import { PublicArtistProfile } from "@ui/design-system/components/organisms/PublicArtistProfile";

type Props = React.ComponentProps<typeof PublicArtistProfile>;

export const PlayerDetailClientAdapter = (props: Props) => (
  <PublicArtistProfile {...props} />
);
