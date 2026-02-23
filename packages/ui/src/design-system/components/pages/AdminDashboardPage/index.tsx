"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Link as AtomLink } from "@ui/design-system/components/atoms/Link";
import { Calendar, Users, ArrowRight, Clock, ListTodo, LayoutDashboard, CalendarPlus, List } from "lucide-react";
import { cn } from "@ui/shared/utils/mergeClassNames";

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
      "rounded-xl border border-white/10 bg-white/5 text-card-foreground shadow-sm backdrop-blur-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const AdminDashboardPage = () => {
  // サンプルデータ
  const stats = {
    totalEvents: 5,
    activeEvents: 3,
    totalParticipants: 245,
    upcomingEvents: 2,
  };

  const recentEvents = [
    {
      id: 1,
      name: "Beatbox Battle 2025",
      date: "2025-04-01",
      entries: 75,
      capacity: 100,
    },
    {
      id: 2,
      name: "ビートボックスワークショップ",
      date: "2024-05-15",
      entries: 25,
      capacity: 30,
    },
    {
      id: 3,
      name: "ビートボックス初心者向けセミナー",
      date: "2024-05-01",
      entries: 15,
      capacity: 20,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* ダッシュボードヘッダー */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">ダッシュボード</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* 統計カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">イベント総数</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalEvents}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Clock className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">現在開催中</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.activeEvents}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">合計参加者</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalParticipants}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <ListTodo className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">開催予定</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.upcomingEvents}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* クイックアクション */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AtomLink href="/admin/register">
              <Card className="p-6 hover:bg-white/10 transition-colors group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">
                      新規イベント作成
                    </h3>
                    <p className="text-gray-400">
                      新しいイベントを作成し、エントリー受付を開始します
                    </p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </Card>
            </AtomLink>
          </div>

          {/* 最近のイベント */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">最近のイベント</h3>
                <AtomLink
                  href="/admin/list"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  すべて表示
                </AtomLink>
              </div>
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <AtomLink
                    href={`/admin/detail?id=${event.id}`}
                    key={event.id}
                  >
                    <div className="group flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div>
                        <p className="font-medium text-white">{event.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Users className="h-4 w-4" />
                            <span>
                              {event.entries}/{event.capacity}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </AtomLink>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
