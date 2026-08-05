"use client";

import PlayersPage from "@ui/design-system/components/pages/PlayersPage";

type Props = React.ComponentProps<typeof PlayersPage>;

export const PlayersClientAdapter = (props: Props) => (
  <PlayersPage {...props} />
);
