import React, { useState } from "react";
import { Search } from "lucide-react";
import { Link as AtomLink } from "@ui/design-system/components/atoms/Link";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Image as AtomImage } from "@ui/design-system/components/atoms/Image";
import { Input } from "@ui/design-system/components/atoms/Input";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { Stack } from "@ui/design-system/components/atoms/Stack";

type Player = {
  accountId: string;
  name: string;
  imageUrl: string | null;
};

export type { Player };

type PlayersPageProps = {
  players: Player[];
};

const PlayerCard = ({ player }: { player: Player }) => (
  <AtomLink href={`/players/${player.accountId}`}>
    <Card className="group overflow-hidden p-0">
      <div className="relative">
        {player.imageUrl ? (
          <AtomImage
            src={player.imageUrl}
            alt={player.name}
            className="h-[300px] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center bg-secondary">
            <Typography variant="small" tone="muted">
              写真は未登録
            </Typography>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent p-5">
          <Typography variant="h4">{player.name}</Typography>
        </div>
      </div>
    </Card>
  </AtomLink>
);

const PlayersPage = ({ players }: PlayersPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const keyword = searchQuery.trim().toLowerCase();
  const visiblePlayers = keyword
    ? players.filter((player) => player.name.toLowerCase().includes(keyword))
    : players;

  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-24 text-foreground">
      <div className="container mx-auto max-w-6xl">
        <Stack gap="lg">
          <Stack gap="sm">
            <Typography variant="h2">Discover Beatbox Artists</Typography>
            <Typography variant="p" tone="muted">
              公開されているプレイヤーのプロフィールを探せます。
            </Typography>
          </Stack>

          {players.length === 0 ? (
            <Card>
              <Stack gap="sm">
                <Typography variant="h4">
                  まだ公開されているプレイヤーがいません
                </Typography>
                <Typography variant="small" tone="muted">
                  プロフィールが公開されると、ここに表示されます。
                </Typography>
              </Stack>
            </Card>
          ) : (
            <Stack gap="md">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="活動名で検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {visiblePlayers.length === 0 ? (
                <Typography variant="small" tone="muted">
                  該当するプレイヤーが見つかりません。
                </Typography>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {visiblePlayers.map((player) => (
                    <PlayerCard key={player.accountId} player={player} />
                  ))}
                </div>
              )}
            </Stack>
          )}
        </Stack>
      </div>
    </div>
  );
};

export default PlayersPage;
