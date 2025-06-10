
"use client";

import type { User, UserStatus, ReadStatusTimestamps } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MoreVertical, Plus, Pencil, Camera, MessageCircle } from "lucide-react";
import { useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
import { getStatusThemeClasses } from '@/config/statusThemes';


interface StatusPageProps {
  currentUser: User | null;
  userStatuses: UserStatus[]; // Should be activeUserStatuses from page.tsx
  onTriggerCreateStatus: () => void;
  onTriggerViewUserStatuses: (userId: string) => void;
  statusReadTimestamps: ReadStatusTimestamps;
  currentUserActiveStatusesCount: number;
  otherUsersGroupedStatuses: Record<string, UserStatus[]>;
}

const createSegmentedRingSVGSimple = (
  segmentCount: number,
  isAllRead: boolean,
  avatarSize: number = 48,
  strokeWidth: number = 2.5,
  gapPercentage: number = 0.08
): string => {
  if (segmentCount <= 0) return "";
  const radius = avatarSize / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const color = isAllRead ? 'hsl(var(--border))' : 'hsl(var(--primary))';

  if (segmentCount === 1) {
    return `<svg viewBox="0 0 ${avatarSize} ${avatarSize}" class="absolute inset-0 h-full w-full overflow-visible">
              <circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />
            </svg>`;
  }
  const totalSegmentLength = circumference / segmentCount;
  const dashLength = totalSegmentLength * (1 - gapPercentage);
  const gapLength = totalSegmentLength * gapPercentage;
  return `<svg viewBox="0 0 ${avatarSize} ${avatarSize}" class="absolute inset-0 h-full w-full overflow-visible">
            <circle
              cx="${avatarSize / 2}"
              cy="${avatarSize / 2}"
              r="${radius}"
              fill="none"
              stroke="${color}"
              stroke-width="${strokeWidth}"
              stroke-dasharray="${dashLength} ${gapLength}"
              transform="rotate(-90 ${avatarSize / 2} ${avatarSize / 2})" />
          </svg>`;
};


export function StatusPage({
  currentUser,
  userStatuses, // This will be activeUserStatuses
  onTriggerCreateStatus,
  onTriggerViewUserStatuses,
  statusReadTimestamps,
  currentUserActiveStatusesCount,
  otherUsersGroupedStatuses,
}: StatusPageProps) {

  const getInitials = (name: string | undefined, length: number = 1) => {
    if (!name) return "?";
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, length).toUpperCase();
    if (length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + (names.length > 1 ? names[names.length - 1][0].toUpperCase() : "");
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    try {
      if (isToday(date)) {
        return format(date, "HH:mm", { locale: idLocale });
      }
      if (isYesterday(date)) {
        return `Kemarin, ${format(date, "HH:mm", { locale: idLocale })}`;
      }
      return formatDistanceToNowStrict(date, { addSuffix: true, locale: idLocale });
    } catch (e) {
      return format(date, "dd/MM/yy", { locale: idLocale });
    }
  };

  const myLatestStatus = useMemo(() => {
    if (!currentUser || currentUserActiveStatusesCount === 0) return null;
    // userStatuses here is already the sorted currentUserActiveStatuses from page.tsx if viewing "My Status" or activeUserStatuses
    const myStatuses = userStatuses.filter(s => s.userId === currentUser.id);
    return myStatuses.length > 0 ? myStatuses[0] : null; // Already sorted, first is latest
  }, [userStatuses, currentUser, currentUserActiveStatusesCount]);


  const otherUsersLatestStatus = useMemo(() => {
    return Object.values(otherUsersGroupedStatuses).map(statuses => statuses[0])
           .sort((a,b) => b.timestamp - a.timestamp);
  }, [otherUsersGroupedStatuses]);


  if (!currentUser) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-muted-foreground">
        Memuat status pengguna...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background h-full relative">
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background z-10 border-b">
        <h1 className="text-2xl font-semibold text-foreground">Pembaruan</h1>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="text-foreground/70 md:hover:text-foreground">
            <Search className="h-5 w-5" />
            <span className="sr-only">Cari</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-foreground/70 md:hover:text-foreground">
            <MoreVertical className="h-5 w-5" />
            <span className="sr-only">Opsi lainnya</span>
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="px-2 py-4 space-y-5 md:px-4">
          <div>
            <h2 className="text-md font-semibold mb-1.5 text-foreground px-2">Status</h2>
            <div
              className="flex items-center space-x-3 cursor-pointer md:hover:bg-muted/30 p-2 rounded-lg"
              onClick={() => onTriggerViewUserStatuses(currentUser.id)}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={currentUser.avatarUrl} alt="My Status Avatar" data-ai-hint="person abstract"/>
                  <AvatarFallback>{getInitials(currentUser.name, 2)}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-background flex items-center justify-center">
                    <Plus className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex items-center space-x-2">
                    <p className="font-medium text-foreground truncate">
                        Status Saya
                    </p>
                    {currentUserActiveStatusesCount > 0 && myLatestStatus && (
                         <div className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            getStatusThemeClasses(myLatestStatus.backgroundColorName).bg
                         )} />
                    )}
                 </div>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUserActiveStatusesCount > 0 && myLatestStatus
                    ? `${currentUserActiveStatusesCount} pembaruan • ${formatTimestamp(myLatestStatus.timestamp)}`
                    : "Akan hilang setelah 24 jam"}
                </p>
              </div>
            </div>
          </div>

          {otherUsersLatestStatus.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground mb-2 tracking-wide px-2">PEMBARUAN TERKINI</h2>
              <div className="space-y-0.5">
                {otherUsersLatestStatus.map(latestStatusOfUser => {
                    const allStatusesForThisUser = otherUsersGroupedStatuses[latestStatusOfUser.userId] || [];
                    const segmentCount = allStatusesForThisUser.length;
                    const lastReadTimestampByCurrentUser = currentUser?.id && statusReadTimestamps?.[currentUser.id]?.[latestStatusOfUser.userId] || 0;
                    const isAllRead = allStatusesForThisUser.length > 0 && allStatusesForThisUser[0].timestamp <= lastReadTimestampByCurrentUser;

                    return (
                        <div
                          key={latestStatusOfUser.id} // Use status id, but ensure it's unique if multiple users can have same id (not the case here)
                          className="flex items-center space-x-3 cursor-pointer md:hover:bg-muted/30 p-2 rounded-lg"
                          onClick={() => onTriggerViewUserStatuses(latestStatusOfUser.userId)}
                        >
                            <div className="relative">
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    dangerouslySetInnerHTML={{ __html: createSegmentedRingSVGSimple(segmentCount, isAllRead) }}
                                />
                                <Avatar className="h-12 w-12 border-2 border-transparent">
                                <AvatarImage src={latestStatusOfUser.userAvatarUrl} alt={latestStatusOfUser.userName} data-ai-hint="person abstract status"/>
                                <AvatarFallback>{getInitials(latestStatusOfUser.userName, 2)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{latestStatusOfUser.userName}</p>
                                <div className="flex items-center space-x-1.5">
                                    <p className="text-xs text-muted-foreground truncate">{formatTimestamp(latestStatusOfUser.timestamp)}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
              </div>
            </div>
          )}
           {otherUsersLatestStatus.length === 0 && userStatuses.length > 0 && currentUserActiveStatusesCount === userStatuses.length && (
             <div className="pt-8 text-center px-2">
                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Belum ada pembaruan dari pengguna lain.</p>
                <p className="mt-1 text-xs text-muted-foreground/80">Mulai chat dengan teman untuk melihat status mereka.</p>
            </div>
           )}
           {userStatuses.length === 0 && (
             <div className="pt-8 text-center px-2">
                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Belum ada pembaruan status.</p>
                <p className="mt-1 text-xs text-muted-foreground/80">Buat status untuk dibagikan ke teman Anda.</p>
            </div>
           )}
        </div>
      </ScrollArea>

      <div className="absolute bottom-6 right-4 flex flex-col items-end space-y-3 z-20">
         <Button
            variant="secondary"
            size="icon"
            className="rounded-full h-12 w-12 shadow-lg bg-card md:hover:bg-muted focus-visible:ring-gray-400"
            onClick={onTriggerCreateStatus}
            aria-label="Buat status teks"
          >
            <Pencil className="h-5 w-5 text-foreground/90" />
         </Button>
         <Button
            variant="default"
            size="icon"
            className="rounded-full h-14 w-14 shadow-lg bg-green-500 md:hover:bg-green-600 text-white focus-visible:ring-green-300"
            aria-label="Buat status foto atau video"
            onClick={() => alert("Fitur status foto/video akan segera hadir!")}
          >
            <Camera className="h-6 w-6" />
         </Button>
      </div>
    </div>
  );
}
