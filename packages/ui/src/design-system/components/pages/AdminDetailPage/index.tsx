"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { Users, Calendar, Clock, MapPin, Search, Check, LayoutDashboard, CalendarPlus, List } from "lucide-react";
import { Link as AtomLink } from "@ui/design-system/components/atoms/Link";
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

// Button Component
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "destructive";
    size?: "default" | "sm";
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        variant === "default" &&
          "bg-blue-500/20 hover:bg-blue-500/30 text-white",
        variant === "destructive" &&
          "bg-red-500/20 hover:bg-red-500/30 text-white",
        size === "default" && "h-10 px-4 py-2",
        size === "sm" && "h-8 px-3 text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

// Card Components
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-white/10 text-card-foreground",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// Tabs Components
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-white/5 p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// Progress Component
const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// Types
interface EventData {
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  capacity: number;
  entries: number;
  waitlist: number;
}

type ParticipantStatus = "confirmed" | "waiting" | "cancelled";

interface Participant {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: ParticipantStatus;
  isCheckedIn: boolean;
}

// チェックインボタン
const CheckInButton = ({
  participantId,
  isCheckedIn,
  onCheckIn,
}: {
  participantId: number;
  isCheckedIn: boolean;
  onCheckIn: (id: number) => void;
}) => {
  return (
    <button
      onClick={() => onCheckIn(participantId)}
      className={cn(
        "px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2",
        isCheckedIn
          ? "bg-green-500/20 text-green-400"
          : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
      )}
    >
      <Check className="w-4 h-4" />
      {isCheckedIn ? "チェックイン済み" : "チェックイン"}
    </button>
  );
};

// 参加者リスト
const ParticipantList = ({
  participants,
  onCheckIn,
  onStatusChange,
  showStatusChange = false,
}: {
  participants: Participant[];
  onCheckIn: (id: number) => void;
  onStatusChange: (id: number, status: ParticipantStatus) => void;
  showStatusChange?: boolean;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredParticipants = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          className="w-full pl-10 py-2 rounded-lg border border-white/10 bg-white/5 text-white"
          placeholder="参加者を検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="space-y-4">
        {filteredParticipants.map((participant) => (
          <div
            key={participant.id}
            className="group relative overflow-hidden rounded-xl bg-white/5 p-6 transition-all hover:bg-white/10"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-500" />
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-white">{participant.name}</p>
                <p className="text-sm text-gray-400">{participant.email}</p>
                <p className="text-sm text-gray-400">{participant.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckInButton
                  participantId={participant.id}
                  isCheckedIn={participant.isCheckedIn}
                  onCheckIn={onCheckIn}
                />
                {showStatusChange && participant.status === "waiting" && (
                  <button
                    onClick={() => onStatusChange(participant.id, "confirmed")}
                    className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-full transition-all"
                  >
                    確定する
                  </button>
                )}
                {(!participant.isCheckedIn ||
                  participant.status === "waiting") && (
                  <button
                    onClick={() => onStatusChange(participant.id, "cancelled")}
                    className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full transition-all"
                  >
                    キャンセル
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminDetailPage = () => {
  // イベントデータのサンプル
  const [eventData, setEventData] = useState<EventData>({
    name: "ビートボックスバトル2025",
    date: "2025-04-01",
    time: "13:00 - 18:00",
    location: "渋谷区文化センター",
    description:
      "国内最大規模のビートボックスバトル大会。優勝者は世界大会への出場権を獲得できます。",
    capacity: 100,
    entries: 75,
    waitlist: 10,
  });

  // 参加確定者のサンプルデータ
  const [confirmedParticipants, setConfirmedParticipants] = useState<
    Participant[]
  >(
    Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `参加者${i + 1}`,
      email: `user${i + 1}@example.com`,
      phone: `090-1234-${(i + 1).toString().padStart(4, "0")}`,
      status: "confirmed",
      isCheckedIn: i < 8, // 最初の8人はチェックイン済み
    }))
  );

  // キャンセル待ちのサンプルデータ
  const [waitlistParticipants, setWaitlistParticipants] = useState<
    Participant[]
  >(
    Array.from({ length: 10 }, (_, i) => ({
      id: 100 + i + 1,
      name: `キャンセル待ち${i + 1}`,
      email: `waitlist${i + 1}@example.com`,
      phone: `090-5678-${(i + 1).toString().padStart(4, "0")}`,
      status: "waiting",
      isCheckedIn: false,
    }))
  );

  // チェックイン処理
  const handleCheckIn = (participantId: number) => {
    // 参加確定者のチェックイン処理
    const updatedConfirmedParticipants = confirmedParticipants.map((p) =>
      p.id === participantId ? { ...p, isCheckedIn: true } : p
    );

    if (
      JSON.stringify(updatedConfirmedParticipants) !==
      JSON.stringify(confirmedParticipants)
    ) {
      setConfirmedParticipants(updatedConfirmedParticipants);
      return;
    }

    // キャンセル待ちのチェックイン処理
    const updatedWaitlistParticipants = waitlistParticipants.map((p) =>
      p.id === participantId ? { ...p, isCheckedIn: true } : p
    );

    setWaitlistParticipants(updatedWaitlistParticipants);
  };

  // 参加者ステータス変更処理
  const handleStatusChange = (
    participantId: number,
    newStatus: ParticipantStatus
  ) => {
    try {
      if (newStatus === "cancelled") {
        // 参加確定者のキャンセル処理
        const updatedConfirmedParticipants = confirmedParticipants.filter(
          (p) => p.id !== participantId
        );
        setConfirmedParticipants(updatedConfirmedParticipants);
        setEventData((prev) => ({
          ...prev,
          entries: prev.entries - 1,
        }));

        // キャンセル待ちのキャンセル処理
        const updatedWaitlistParticipants = waitlistParticipants.filter(
          (p) => p.id !== participantId
        );
        if (
          waitlistParticipants.length !== updatedWaitlistParticipants.length
        ) {
          setWaitlistParticipants(updatedWaitlistParticipants);
          setEventData((prev) => ({
            ...prev,
            waitlist: prev.waitlist - 1,
          }));
        }
      } else if (newStatus === "confirmed") {
        // キャンセル待ちから確定へ
        const participant = waitlistParticipants.find(
          (p) => p.id === participantId
        );
        if (participant) {
          // キャンセル待ちリストから削除
          const updatedWaitlistParticipants = waitlistParticipants.filter(
            (p) => p.id !== participantId
          );
          setWaitlistParticipants(updatedWaitlistParticipants);

          // 確定リストに追加
          setConfirmedParticipants([
            ...confirmedParticipants,
            { ...participant, status: "confirmed" },
          ]);

          // イベントデータの更新
          setEventData((prev) => ({
            ...prev,
            entries: prev.entries + 1,
            waitlist: prev.waitlist - 1,
          }));
        }
      }
    } catch (error) {
      console.error("Status change error:", error);
    }
  };

  // チェックイン済みの人数を計算
  const checkedInCount = confirmedParticipants.filter(
    (p) => p.isCheckedIn
  ).length;

  return (
    <div className="min-h-screen relative bg-black">
      <AdminHeader />
      <div className="container mx-auto p-4">
        <Tabs defaultValue="details" className="space-y-8">
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="details" className="text-lg px-6">
                イベント詳細
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="text-lg px-6">
                参加確定者 ({confirmedParticipants.length})
              </TabsTrigger>
              <TabsTrigger value="waitlist" className="text-lg px-6">
                キャンセル待ち ({waitlistParticipants.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>{eventData.name}</CardTitle>
                <CardDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{eventData.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{eventData.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{eventData.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="h-4 w-4" />
                      <span>
                        {eventData.entries}/{eventData.capacity}
                      </span>
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">参加登録状況</p>
                    <Progress
                      value={(eventData.entries / eventData.capacity) * 100}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white/5 rounded-lg p-4 flex-1">
                      <p className="text-sm text-gray-400">参加確定</p>
                      <p className="text-2xl font-bold">
                        {eventData.entries}名
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 flex-1">
                      <p className="text-sm text-gray-400">キャンセル待ち</p>
                      <p className="text-2xl font-bold">
                        {eventData.waitlist}名
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 flex-1">
                      <p className="text-sm text-gray-400">チェックイン済み</p>
                      <p className="text-2xl font-bold">{checkedInCount}名</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confirmed">
            <div className="max-w-4xl mx-auto">
              <ParticipantList
                participants={confirmedParticipants}
                onCheckIn={handleCheckIn}
                onStatusChange={handleStatusChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="waitlist">
            <div className="max-w-4xl mx-auto">
              <ParticipantList
                participants={waitlistParticipants}
                onCheckIn={handleCheckIn}
                onStatusChange={handleStatusChange}
                showStatusChange={true}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDetailPage;
