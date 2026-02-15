"use client";

import React, { useRef, useState } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Star,
  TrendingUp,
  Shuffle,
  Pause,
  Play,
} from "lucide-react";
import { Link as AtomLink } from "@ui/design-system/components/atoms/Link";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Image as AtomImage } from "@ui/design-system/components/atoms/Image";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Select } from "@ui/design-system/components/atoms/Select";
import { SelectTrigger } from "@ui/design-system/components/atoms/Select/Trigger";
import { SelectValue } from "@ui/design-system/components/atoms/Select/Value";
import { SelectContent } from "@ui/design-system/components/atoms/Select/Content";
import { SelectItem } from "@ui/design-system/components/atoms/Select/Item";
import Header from "@ui/design-system/components/molecules/header";
import { TabButton } from "@ui/design-system/components/molecules/TabButton";
import { SectionHeader } from "@ui/design-system/components/molecules/SectionHeader";
import { SearchInput } from "@ui/design-system/components/molecules/SearchInput";

type Player = {
  id: number;
  name: string;
  image: string;
  audioFile?: string;
};

type SortOrder = "asc" | "desc";
type ActiveSection = "discover" | "search";

type PlayersPageProps = {
  players: Player[];
};

const PlayerCard = ({ player }: { player: Player }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!player.audioFile || !audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Audio playback failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  const handleAudioError = () => {
    setIsLoading(false);
    setIsPlaying(false);
    console.error("Audio loading failed");
  };

  return (
    <AtomLink href={`/player/${player.id}`}>
      <Card className="bg-black/40 backdrop-blur-lg border-0 overflow-hidden group cursor-pointer">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-black opacity-70" />
          {player.image ? (
            <AtomImage
              src={player.image}
              alt={player.name}
              width={500}
              height={300}
              className="w-full h-[300px] object-cover filter brightness-75 saturate-50 group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-[300px] bg-gray-700 flex items-center justify-center">
              <p className="text-gray-400 text-sm">まだ登録されていません</p>
            </div>
          )}

          {player.audioFile && (
            <>
              <audio
                ref={audioRef}
                src={player.audioFile}
                onEnded={handleAudioEnd}
                onError={handleAudioError}
                preload="metadata"
              />
              <Button
                variant="icon"
                size="icon"
                onClick={handlePlayClick}
                disabled={isLoading}
                className="absolute bottom-0 right-0 transform -translate-x-1/2 -translate-y-1/2
                          w-16 h-16 bg-purple-500/80 hover:bg-purple-500
                          flex items-center justify-center
                          transition-all duration-300 opacity-0 group-hover:opacity-100
                          backdrop-blur-sm z-10"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8 text-white ml-0" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </Button>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
            <h2 className="text-4xl font-bold text-white">{player.name}</h2>
          </div>
        </div>
      </Card>
    </AtomLink>
  );
};

const SearchFilters = ({
  searchQuery,
  onSearchChange,
  onFilter,
  onSort,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onFilter: () => void;
  onSort: () => void;
}) => (
  <div className="bg-black/50 backdrop-blur-lg rounded-lg p-6 mb-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search players..."
      />
      <div className="flex gap-4">
        <Button variant="primary" className="flex-1" onClick={onFilter}>
          <Filter className="w-4 h-4" />
          Style
        </Button>
        <Button variant="primary" className="flex-1" onClick={onSort}>
          <ArrowUpDown className="w-4 h-4" />
          Sort
        </Button>
      </div>
      <div className="flex gap-4">
        <Select>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kanto">関東</SelectItem>
            <SelectItem value="kansai">関西</SelectItem>
            <SelectItem value="other">その他</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">初心者</SelectItem>
            <SelectItem value="intermediate">中級者</SelectItem>
            <SelectItem value="advanced">上級者</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);

function PlayersPage({ players }: PlayersPageProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterSpeciality, setFilterSpeciality] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>("discover");
  const [randomPlayers, setRandomPlayers] = useState<Player[]>(
    players.slice(0, 4)
  );

  const processedPlayers = players
    .filter((player) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = player.name.toLowerCase().includes(searchLower);

      return matchesSearch;
    })
    .sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleFilter = () => {
    const specialities = ["Aggressive", "Tactical"];
    const currentIndex = specialities.indexOf(filterSpeciality || "");
    setFilterSpeciality(
      currentIndex === specialities.length - 1
        ? null
        : specialities[currentIndex + 1]
    );
  };

  const handleShuffle = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5).slice(0, 4);
    setRandomPlayers(shuffled);
  };

  const featuredPlayers = players.slice(0, 3);
  const newPlayers = players.slice(3, 7);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900">
      <Header />

      <div className="max-w-6xl mx-auto pt-[100px]">
        <div className="flex flex-col items-center text-center md:mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Discover Beatbox Artists
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl">
            発見が歴史を創り、未来を共創する。 次世代が、今始動する
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <TabButton
            isActive={activeSection === "discover"}
            onClick={() => setActiveSection("discover")}
            icon={Star}
          >
            Discover
          </TabButton>
          <TabButton
            isActive={activeSection === "search"}
            onClick={() => setActiveSection("search")}
            icon={Search}
          >
            Search
          </TabButton>
        </div>

        {activeSection === "discover" && (
          <div className="space-y-12 p-4 md:p-8">
            <section className="mb-12">
              <SectionHeader icon={Star} title="Featured Players" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPlayers.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </section>

            <section className="mb-12">
              <SectionHeader icon={TrendingUp} title="New Players" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {newPlayers.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </section>

            <section>
              <SectionHeader
                icon={Shuffle}
                title="Random Discoveries"
                actionButton={
                  <Button variant="link" onClick={handleShuffle}>
                    <Shuffle className="w-4 h-4" />
                    Shuffle
                  </Button>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {randomPlayers.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeSection === "search" && (
          <div className="p-4 md:p-8">
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onFilter={handleFilter}
              onSort={handleSort}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {processedPlayers.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayersPage;
