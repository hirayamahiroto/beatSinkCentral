"use client";

import React from "react";
import { Image as AtomImage } from "@ui/design-system/components/atoms/Image";
import {
  MapPin,
  Users,
  ArrowRight,
  Search,
  Filter,
  ArrowUpDown,
  X,
  Menu,
} from "lucide-react";
import { Link as AtomLink } from "@ui/design-system/components/atoms/Link";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 w-full z-50 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="text-xl font-bold text-white">Beat Sink Central</div>
          <button
            className="sm:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="sm:hidden bg-black/90 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col gap-4">
              <AtomLink href="/" className="text-gray-300 hover:text-white transition-colors px-4 py-2">ホーム</AtomLink>
              <AtomLink href="/playerList" className="text-gray-300 hover:text-white transition-colors px-4 py-2">プレイヤー</AtomLink>
              <AtomLink href="/event" className="text-gray-300 hover:text-white transition-colors px-4 py-2">イベント</AtomLink>
              <AtomLink href="/about" className="text-gray-300 hover:text-white transition-colors px-4 py-2">運営情報</AtomLink>
              <hr className="border-white/10" />
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-sm font-medium transition-colors w-full">ログイン</button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
import { useState } from "react";
import { events } from "../../../../../../data/events";

const EventPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const featuredEvent = events.find((event) => event.isFeatured);
  const currentDate = new Date();

  const filteredEvents = events
    .filter((event) => !event.isFeatured)
    .filter((event) => {
      const eventDate = new Date(event.date);
      if (activeTab === "upcoming") {
        return eventDate >= currentDate;
      } else {
        return eventDate < currentDate;
      }
    })
    .filter((event) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        event.title.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        false;
      const matchesType = !filterType || event.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const comparison =
        new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleFilter = () => {
    const types = ["大会", "ワークショップ", "セミナー", "ショーケース"];
    const currentIndex = types.indexOf(filterType || "");
    setFilterType(
      currentIndex === types.length - 1 ? null : types[currentIndex + 1]
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="container mx-auto px-4 pt-24">
        <h1 className="text-4xl font-bold mb-2">Events</h1>
        <p className="text-xl text-gray-400 mb-4">イベント情報</p>
        <p className="text-gray-400 mb-8">
          ビートボックスの大会やワークショップなど、日本全国で開催される様々なイベント情報をご紹介します。
        </p>

        <p className="text-gray-400 mb-8">
          参加者募集中のイベントから過去の開催情報まで、最新の情報をチェックできます。
        </p>

        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                className="w-full pl-10 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white"
                placeholder="イベントを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                onClick={handleFilter}
              >
                <Filter className="w-4 h-4" />
                {filterType || "全て"}
              </button>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                onClick={handleSort}
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortOrder === "asc" ? "開催日が近い順" : "開催日が遠い順"}
              </button>
            </div>
          </div>
        </div>

        {featuredEvent && (
          <AtomLink href="/eventDetail" className="py-12">
            <div className="container mx-auto px-4">
              <div className="relative rounded-2xl overflow-hidden">
                <AtomImage
                  src={featuredEvent.image}
                  alt={featuredEvent.title}
                  width={1200}
                  height={400}
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="px-3 py-1 bg-blue-500 rounded-full text-sm">
                        Featured
                      </span>
                      <span className="text-gray-300">
                        {featuredEvent.date}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">
                      {featuredEvent.title}
                    </h2>
                    <div className="flex items-center gap-6 text-gray-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{featuredEvent.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>参加者: {featuredEvent.participants}名</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AtomLink>
        )}

        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-4 mb-6">
            <button
              className={`px-6 py-2 rounded-lg transition-all ${
                activeTab === "upcoming"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab("upcoming")}
            >
              開催前のイベント
            </button>
            <button
              className={`px-6 py-2 rounded-lg transition-all ${
                activeTab === "past"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab("past")}
            >
              開催済みのイベント
            </button>
          </div>

          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {activeTab === "upcoming"
                  ? "開催予定のイベントはありません"
                  : "開催済みのイベントはありません"}
              </div>
            ) : (
              filteredEvents.map((event) => (
                <AtomLink href="/eventDetail" key={event.id}>
                  <div className="bg-white/5 hover:bg-white/10 rounded-lg p-6 transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden">
                        <AtomImage
                          src={event.image}
                          alt={event.title}
                          width={1200}
                          height={400}
                          className="w-full h-[400px] object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-400 text-sm">
                            {event.type}
                          </span>
                          <span className="text-gray-400">{event.date}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">
                          {event.title}
                        </h3>
                        <p className="text-gray-400 mb-4">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{event.participants}名</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </AtomLink>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPage;
