"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Calendar, Users, ArrowRight, LayoutDashboard, CalendarPlus, List } from "lucide-react";
import { Link as AtomLink } from "../../atoms/Link";
import { cn } from "../../../../shared/utils/mergeClassNames";

const AdminHeader = () => {
  const pathname = usePathname();
  const navigation = [
    { name: "ダッシュボード", href: "/admin", icon: LayoutDashboard },
    { name: "イベント一覧", href: "/admin/list", icon: List },
    { name: "イベント登録", href: "/admin/register", icon: CalendarPlus },
    { name: "カレンダー", href: "/admin/calendar", icon: Calendar },
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

// Card Component
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

// Types
interface Event {
  id: number;
  name: string;
  date: string;
  capacity: number;
  entries: number;
  location: string;
  status: "upcoming" | "ongoing" | "completed";
}

const AdminListPage = () => {
  const [events] = React.useState<Event[]>([
    {
      id: 1,
      name: "Beatbox Battle 2025",
      date: "2025-04-01",
      capacity: 100,
      entries: 75,
      location: "渋谷区文化センター",
      status: "upcoming",
    },
    {
      id: 2,
      name: "ビートボックスワークショップ",
      date: "2024-05-15",
      capacity: 30,
      entries: 25,
      location: "新宿区民センター",
      status: "upcoming",
    },
    {
      id: 3,
      name: "ビートボックス初心者向けセミナー",
      date: "2024-05-01",
      capacity: 20,
      entries: 15,
      location: "オンライン",
      status: "upcoming",
    },
    {
      id: 4,
      name: "ビートボックスバトル2023",
      date: "2023-10-15",
      capacity: 80,
      entries: 80,
      location: "渋谷クラブクアトロ",
      status: "completed",
    },
    {
      id: 5,
      name: "アジアビートボックスチャンピオンシップ2023",
      date: "2023-07-01",
      capacity: 150,
      entries: 120,
      location: "東京ドームシティホール",
      status: "completed",
    },
  ]);

  // イベント状態に応じた表示テキスト
  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "開催予定";
      case "ongoing":
        return "開催中";
      case "completed":
        return "終了";
      default:
        return "";
    }
  };

  // イベント状態に応じた色
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500/20 text-blue-400";
      case "ongoing":
        return "bg-green-500/20 text-green-400";
      case "completed":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">イベント一覧</h1>
            <AtomLink
              href="/admin/register"
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-white rounded-lg transition-colors"
            >
              新規イベント作成
            </AtomLink>
          </div>

          <div className="grid gap-4">
            {events.map((event) => (
              <AtomLink href={`/admin/detail?id=${event.id}`} key={event.id}>
                <Card className="group relative overflow-hidden bg-white/5 hover:bg-white/10 transition-all duration-300">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-500" />
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-white">
                        {event.name}
                      </h2>
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-sm font-medium",
                          getStatusColor(event.status)
                        )}
                      >
                        {getStatusText(event.status)}
                      </span>
                    </div>
                    <div className="grid gap-2 text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {event.entries}/{event.capacity}名
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                        <span className="mr-2">詳細を見る</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </AtomLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminListPage;
