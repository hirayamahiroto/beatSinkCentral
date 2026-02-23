"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import jaLocale from "@fullcalendar/core/locales/ja";
import interactionPlugin from "@fullcalendar/interaction";
import { LayoutDashboard, CalendarPlus, List, Calendar as CalendarIcon } from "lucide-react";
import { Link as AtomLink } from "@ui/design-system/components/atoms/Link";
import { cn } from "@ui/shared/utils/mergeClassNames";

const AdminHeader = () => {
  const pathname = usePathname();
  const navigation = [
    { name: "ダッシュボード", href: "/admin", icon: LayoutDashboard },
    { name: "イベント一覧", href: "/admin/list", icon: List },
    { name: "イベント登録", href: "/admin/register", icon: CalendarPlus },
    { name: "カレンダー", href: "/admin/calendar", icon: CalendarIcon },
  ];
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <AtomLink href="/admin/list" className="text-xl font-bold text-white">Event Admin</AtomLink>
            <nav className="flex items-center space-x-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <AtomLink
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive ? "text-white bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </AtomLink>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

// イベントの型定義
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  organizer: string;
  location: string;
  type: "own" | "other"; // own: 自分のイベント, other: 他のオーガナイザーのイベント
  status: "upcoming" | "ongoing" | "completed";
}

// イベント詳細モーダル
const EventDetailModal = ({
  event,
  onClose,
}: {
  event: CalendarEvent;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white">{event.title}</h3>
            <p className="text-gray-400 text-sm">{event.organizer}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-300">
              <span className="font-medium">開催日時:</span>
              <span>
                {new Date(event.start).toLocaleDateString("ja-JP")} -
                {new Date(event.end).toLocaleDateString("ja-JP")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="font-medium">会場:</span>
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-300">ステータス:</span>
              <span
                className={cn(
                  "px-2 py-1 rounded-full text-sm",
                  event.status === "upcoming" && "bg-blue-500/20 text-blue-300",
                  event.status === "ongoing" &&
                    "bg-green-500/20 text-green-300",
                  event.status === "completed" && "bg-gray-500/20 text-gray-300"
                )}
              >
                {event.status === "upcoming" && "開催予定"}
                {event.status === "ongoing" && "開催中"}
                {event.status === "completed" && "終了"}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              閉じる
            </button>
            {event.type === "own" && (
              <button
                onClick={() =>
                  (window.location.href = `/admin/detail?id=${event.id}`)
                }
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-white rounded-lg transition-colors"
              >
                詳細を見る
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarView = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );

  // サンプルイベントデータをuseMemoでラップ
  const events = React.useMemo<CalendarEvent[]>(
    () => [
      {
        id: "1",
        title: "Beatbox Battle 2025",
        start: "2025-04-01",
        end: "2025-04-01",
        organizer: "自分",
        location: "渋谷区文化センター",
        type: "own",
        status: "upcoming",
      },
      {
        id: "2",
        title: "関西ビートボックスバトル",
        start: "2025-04-15",
        end: "2025-04-15",
        organizer: "大阪ビートボックス協会",
        location: "大阪市民センター",
        type: "other",
        status: "upcoming",
      },
    ],
    []
  );

  React.useEffect(() => {
    const calendarEl = document.getElementById("calendar");
    if (calendarEl) {
      const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: "dayGridMonth",
        locale: jaLocale,
        events: events.map((event) => ({
          ...event,
          className: cn(
            event.type === "own" ? "bg-blue-500/50" : "bg-purple-500/50",
            "hover:opacity-80 cursor-pointer"
          ),
        })),
        eventClick: (info) => {
          const event = events.find((e) => e.id === info.event.id);
          if (event) setSelectedEvent(event);
        },
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        },
        height: "auto",
        contentHeight: "auto",
      });

      calendar.render();

      return () => {
        calendar.destroy();
      };
    }
  }, [events]);

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />
      <div className="container mx-auto p-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm">
            <div id="calendar"></div>
          </div>

          <div className="flex gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500/50"></div>
              <span className="text-gray-400">自分のイベント</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500/50"></div>
              <span className="text-gray-400">
                他のオーガナイザーのイベント
              </span>
            </div>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default CalendarView;
