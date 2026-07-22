"use client";

import { PublicArtistProfile } from "@ui/design-system/components/organisms/PublicArtistProfile";

type Props = React.ComponentProps<typeof PublicArtistProfile>;

export const PublicArtistProfileClientAdapter = (props: Props) => (
  <PublicArtistProfile {...props} />
);
