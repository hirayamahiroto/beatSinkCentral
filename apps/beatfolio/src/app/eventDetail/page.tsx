"use client";

import Image from "next/image";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Share2,
  Trophy,
  Check,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { players } from "../../../../../packages/data/players";
import Link from "next/link";

const EVENT_DATA = {
  id: 1,
  title: "Beatbox Championship 2024",
  date: "2024.03.21",
  time: "12:00 - 20:00",
  type: "大会",
  location: "東京都渋谷区",
  venue: "渋谷ストリームホール",
  participants: 128,
  capacity: 150,
  description:
    "日本一のビートボクサーを決める年に一度の大会。優勝者は世界大会への切符を手にします。",
  image: "/image1.jpeg",
  price: "5,000円",
  entryMemo: "※当日支払いとなります。",
  ticketPrice: "2,000円",
  ticketMemo: "※100名まで",
  prizes: [
    { rank: "優勝", reward: "賞金50万円 + 世界大会出場権" },
    { rank: "準優勝", reward: "賞金30万円" },
    { rank: "3位", reward: "賞金10万円" },
  ],
  schedule: [
    { time: "12:00", content: "開場・受付開始" },
    { time: "13:00", content: "予選ラウンド開始" },
    { time: "16:00", content: "準決勝" },
    { time: "18:00", content: "決勝戦" },
    { time: "19:30", content: "表彰式" },
  ],
  entrants: players.slice(0, 5),
};

// モーダルコンポーネント
const EntryModal = ({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventTitle: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold mb-4 text-white">エントリー確認</h3>
        <p className="text-gray-300 mb-6">
          「{eventTitle}」にエントリーしますか？
        </p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            エントリーする
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

// キャンセルモーダルコンポーネント
const CancelModal = ({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventTitle: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold mb-4 text-white">キャンセル確認</h3>
        <p className="text-gray-300 mb-6">
          「{eventTitle}」のエントリーをキャンセルしますか？
        </p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-medium transition-all flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            キャンセルする
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
};

// チケット購入モーダル
const TicketModal = ({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
  price,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventTitle: string;
  price: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold mb-4 text-white">チケット購入確認</h3>
        <p className="text-gray-300 mb-2">「{eventTitle}」の観戦チケット</p>
        <p className="text-xl font-bold text-blue-400 mb-6">{price}</p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            購入する
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

// エントリーボタンコンポーネント
const EntryButton = ({
  capacity,
  entries,
  isEntered,
  onEntry,
  onCancel,
}: {
  capacity: number;
  entries: number;
  isEntered: boolean;
  onEntry: () => void;
  onCancel: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (action: () => void) => {
    try {
      setIsLoading(true);
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  if (isEntered) {
    return (
      <div className="space-y-3">
        <div className="w-full py-3 bg-green-600/20 text-green-400 rounded-full flex items-center justify-center gap-2">
          <Check className="w-5 h-5" />
          エントリー済み
        </div>
        <button
          onClick={() => handleClick(onCancel)}
          disabled={isLoading}
          className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-full font-medium transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            "処理中..."
          ) : (
            <>
              <XCircle className="w-5 h-5" />
              キャンセルする
            </>
          )}
        </button>
      </div>
    );
  }

  if (entries >= capacity) {
    return (
      <button
        disabled
        className="w-full py-3 bg-gray-600/20 text-gray-400 rounded-full flex items-center justify-center gap-2"
      >
        <XCircle className="w-5 h-5" />
        定員に達しました
      </button>
    );
  }

  return (
    <button
      onClick={() => handleClick(onEntry)}
      disabled={isLoading}
      className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-all flex items-center justify-center gap-2"
    >
      {isLoading ? (
        "処理中..."
      ) : (
        <>
          <Check className="w-5 h-5" />
          エントリーする
        </>
      )}
    </button>
  );
};

export default function EventDetail() {
  const [eventData, setEventData] = useState({
    ...EVENT_DATA,
    isEntered: false,
    hasTicket: false, // チケット購入状態を追加
  });
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const handleEntry = async () => {
    try {
      // ここで実際のAPIコールを行う
      // const response = await fetch('/api/events/entry', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ eventId: eventData.id }),
      // });

      setEventData((prev) => ({
        ...prev,
        participants: prev.participants + 1,
        isEntered: true,
      }));

      alert("エントリーが完了しました！");
      setIsEntryModalOpen(false);
    } catch (error) {
      console.error("エントリーに失敗しました:", error);
      alert("エントリーに失敗しました。もう一度お試しください。");
    }
  };

  const handleCancel = async () => {
    try {
      // ここで実際のAPIコールを行う
      // const response = await fetch('/api/events/cancel', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ eventId: eventData.id }),
      // });

      setEventData((prev) => ({
        ...prev,
        participants: prev.participants - 1,
        isEntered: false,
      }));

      alert("キャンセルが完了しました。");
      setIsCancelModalOpen(false);
    } catch (error) {
      console.error("キャンセルに失敗しました:", error);
      alert("キャンセルに失敗しました。もう一度お試しください。");
    }
  };

  const handleTicketPurchase = async () => {
    try {
      // ここで実際のAPIコールを行う
      // const response = await fetch('/api/tickets/purchase', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ eventId: eventData.id }),
      // });

      setEventData((prev) => ({
        ...prev,
        hasTicket: true,
      }));

      alert("チケットの購入が完了しました！");
      setIsTicketModalOpen(false);
    } catch (error) {
      console.error("チケットの購入に失敗しました:", error);
      alert("チケットの購入に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="relative h-[60vh]">
        <Image
          src={eventData.image}
          alt={eventData.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <div className="max-w-3xl">
              <span className="inline-block px-3 py-1 bg-blue-500 rounded-full text-sm mb-4">
                {eventData.type}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {eventData.title}
              </h1>
              <div className="flex flex-wrap gap-6 text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{eventData.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{eventData.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{eventData.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>参加者: {eventData.participants}名</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold mb-4">イベント詳細</h2>
              <p className="text-gray-300 leading-relaxed">
                {eventData.description}
              </p>
            </section>

            {/* Schedule */}
            <section>
              <h2 className="text-2xl font-bold mb-4">タイムスケジュール</h2>
              <div className="space-y-4">
                {eventData.schedule.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-6 items-start p-4 bg-white/5 rounded-lg"
                  >
                    <span className="text-blue-400 font-mono">{item.time}</span>
                    <span className="text-gray-300">{item.content}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Prizes */}
            <section>
              <h2 className="text-2xl font-bold mb-4">賞金・賞品</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {eventData.prizes.map((prize, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg">
                    <Trophy className="w-6 h-6 text-yellow-400 mb-2" />
                    <h3 className="font-bold mb-1">{prize.rank}</h3>
                    <p className="text-sm text-gray-400">{prize.reward}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Entrants Section - PCでのみ表示 */}
            <section className="hidden lg:block">
              <h2 className="text-2xl font-bold mb-4">エントリー者一覧</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventData.entrants?.map((player) => (
                  <Link
                    key={player.id}
                    href={`/player`}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-lg"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-blue-600/20">
                      {player.image.startsWith("/") ? (
                        <Image
                          src={player.image}
                          alt={player.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          {player.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-gray-400">{player.rank}</p>
                      <p className="text-xs text-gray-500">{player.team}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="p-6 bg-white/5 rounded-xl">
                <h3 className="text-xl font-bold mb-4">エントリー</h3>
                <p className="text-2xl font-bold text-blue-400 mb-4">
                  {eventData.price}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {eventData.entryMemo}
                </p>
                <EntryButton
                  capacity={eventData.capacity}
                  entries={eventData.participants}
                  isEntered={eventData.isEntered}
                  onEntry={() => setIsEntryModalOpen(true)}
                  onCancel={() => setIsCancelModalOpen(true)}
                />
              </div>

              <div className="p-6 bg-white/5 rounded-xl">
                <h3 className="text-xl font-bold mb-4">観戦チケット</h3>
                <p className="text-2xl font-bold text-blue-400 mb-4">
                  {eventData.ticketPrice}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {eventData.ticketMemo}
                </p>
                {eventData.hasTicket ? (
                  <div className="w-full py-3 bg-green-600/20 text-green-400 rounded-full flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    購入済み
                  </div>
                ) : (
                  <button
                    onClick={() => setIsTicketModalOpen(true)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-full font-medium transition-all flex items-center justify-center gap-2"
                  >
                    チケットを購入
                  </button>
                )}
              </div>

              <div className="p-6 bg-white/5 rounded-xl">
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" />
                  シェアする
                </button>
              </div>

              <div className="p-6 bg-white/5 rounded-xl">
                <h3 className="text-xl font-bold mb-4">会場</h3>
                <p className="text-gray-300 mb-2">{eventData.venue}</p>
                <p className="text-gray-400 text-sm">{eventData.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Entrants Section - SPでのみ表示 */}
        <section className="lg:hidden mt-12">
          <h2 className="text-2xl font-bold mb-4">エントリー者一覧</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventData.entrants?.map((player) => (
              <Link
                key={player.id}
                href={`/player`}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-lg"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-blue-600/20">
                  {player.image.startsWith("/") ? (
                    <Image
                      src={player.image}
                      alt={player.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">
                      {player.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{player.name}</p>
                  <p className="text-sm text-gray-400">{player.rank}</p>
                  <p className="text-xs text-gray-500">{player.team}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Modals */}
      <EntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onConfirm={handleEntry}
        eventTitle={eventData.title}
      />
      <CancelModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancel}
        eventTitle={eventData.title}
      />
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onConfirm={handleTicketPurchase}
        eventTitle={eventData.title}
        price="2,000円"
      />
    </div>
  );
}
