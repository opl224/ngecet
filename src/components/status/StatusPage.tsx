
"use client";

import type { User, UserStatus, ReadStatusTimestamps } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MoreVertical, Plus, Pencil, Camera, MessageCircle } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
import { useToast } from "@/hooks/use-toast";


interface StatusPageProps {
  currentUser: User | null;
  userStatuses: UserStatus[]; 
  currentUserActiveStatuses: UserStatus[]; // Added prop
  otherUsersGroupedStatuses: Record<string, UserStatus[]>;
  onTriggerCreateStatus: () => void;
  onTriggerViewUserStatuses: (userId: string) => void;
  statusReadTimestamps: ReadStatusTimestamps;
}

const createSegmentedRingSVGSimple = (
  segmentCount: number,
  isAllRead: boolean,
  avatarSize: number = 56, // Increased from 48
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
  userStatuses, 
  currentUserActiveStatuses,
  otherUsersGroupedStatuses,
  onTriggerCreateStatus,
  onTriggerViewUserStatuses,
  statusReadTimestamps,
}: StatusPageProps) {
  const { toast } = useToast();

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
    if (!currentUser || currentUserActiveStatuses.length === 0) return null;
    return currentUserActiveStatuses[0]; // Already sorted by timestamp desc in page.tsx
  }, [currentUser, currentUserActiveStatuses]);


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
      <header className="flex items-center justify-between p-4 sticky top-0 bg-background z-10 border-b border-sidebar-border">
        <h1 className="text-xl font-semibold text-foreground">Pembaruan</h1>
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
                { currentUserActiveStatuses.length === 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-background flex items-center justify-center">
                        <Plus className="h-3 w-3 text-white" />
                    </div>
                )}
                { currentUserActiveStatuses.length > 0 && (
                     <div
                        className="absolute inset-0 pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: createSegmentedRingSVGSimple(currentUserActiveStatuses.length, false, 56) }} // false for isAllRead for own status ring for now
                    />
                )}
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex items-center space-x-2">
                    <p className="font-medium text-foreground truncate">
                        Status Saya
                    </p>
                 </div>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUserActiveStatuses.length > 0 && myLatestStatus
                    ? `${currentUserActiveStatuses.length} pembaruan • ${formatTimestamp(myLatestStatus.timestamp)}`
                    : "Ketuk untuk menambahkan pembaruan status"}
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
                    
                    // All statuses for this user are read if the timestamp of the newest one is <= lastReadTimestamp
                    const isAllRead = allStatusesForThisUser.length > 0 && allStatusesForThisUser[0].timestamp <= lastReadTimestampByCurrentUser;


                    return (
                        <div
                          key={latestStatusOfUser.id} 
                          className="flex items-center space-x-3 cursor-pointer md:hover:bg-muted/30 p-2 rounded-lg"
                          onClick={() => onTriggerViewUserStatuses(latestStatusOfUser.userId)}
                        >
                            <div className="relative">
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    dangerouslySetInnerHTML={{ __html: createSegmentedRingSVGSimple(segmentCount, isAllRead, 56) }}
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
           {otherUsersLatestStatus.length === 0 && userStatuses.length > 0 && currentUserActiveStatuses.length === userStatuses.length && (
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
            onClick={() => toast({ title: "Fitur Segera Hadir", description: "Status foto/video akan segera tersedia."})}
          >
            <Camera className="h-6 w-6" />
         </Button>
      </div>
    </div>
  );
}
