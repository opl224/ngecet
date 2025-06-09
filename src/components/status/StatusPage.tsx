
"use client";

import type { User, UserStatus } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MoreVertical, Plus, Pencil, Camera, MessageCircle } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
import { getStatusThemeClasses, type StatusColorThemeName } from '@/config/statusThemes';

const CreateTextStatus = dynamic(() => import('./CreateTextStatus').then(mod => mod.CreateTextStatus), { ssr: false });
const ViewStatus = dynamic(() => import('./ViewStatus').then(mod => mod.ViewStatus), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50"><MessageCircle className="h-10 w-10 text-white animate-pulse" /></div>
});


interface StatusPageProps {
  currentUser: User | null;
  userStatuses: UserStatus[];
  onAddUserStatus: (newStatus: UserStatus) => void;
  onDeleteUserStatus: (statusId: string) => void; // New prop
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function StatusPage({ currentUser, userStatuses, onAddUserStatus, onDeleteUserStatus }: StatusPageProps) {
  const [isCreatingTextStatus, setIsCreatingTextStatus] = useState(false);
  const [viewingUserAllStatuses, setViewingUserAllStatuses] = useState<UserStatus[] | null>(null);
  const [viewingUserInitialStatusIndex, setViewingUserInitialStatusIndex] = useState<number>(0);


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

  const handlePostUserStatus = (text: string, backgroundColorName: StatusColorThemeName) => {
    if (!currentUser) return;
    const newStatus: UserStatus = {
      id: `status_${Date.now()}_${currentUser.id}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatarUrl: currentUser.avatarUrl,
      type: 'text',
      content: text,
      backgroundColorName,
      timestamp: Date.now(),
    };
    onAddUserStatus(newStatus);
    setIsCreatingTextStatus(false);
  };

  const activeUserStatuses = useMemo(() => {
    const now = Date.now();
    return userStatuses
            .filter(status => (now - status.timestamp) < TWENTY_FOUR_HOURS_MS)
            .sort((a,b) => b.timestamp - a.timestamp); 
  }, [userStatuses]);

  const currentUserActiveStatuses = useMemo(() => {
    if (!currentUser) return [];
    return activeUserStatuses.filter(status => status.userId === currentUser.id);
  }, [activeUserStatuses, currentUser]);

  const otherUsersGroupedStatuses = useMemo(() => {
    if (!currentUser) return [];
    const grouped: Record<string, UserStatus[]> = {};
    activeUserStatuses.forEach(status => {
      if (status.userId !== currentUser.id) {
        if (!grouped[status.userId]) {
          grouped[status.userId] = [];
        }
        grouped[status.userId].push(status); 
      }
    });
    return grouped;
  }, [activeUserStatuses, currentUser]);

  const otherUsersLatestStatus = useMemo(() => {
    return Object.values(otherUsersGroupedStatuses).map(statuses => statuses[0]) 
           .sort((a,b) => b.timestamp - a.timestamp); 
  }, [otherUsersGroupedStatuses]);


  const hasMyStatus = currentUserActiveStatuses.length > 0;
  const myLatestStatus = hasMyStatus ? currentUserActiveStatuses[0] : null;
  const myLatestStatusThemeClasses = myLatestStatus ? getStatusThemeClasses(myLatestStatus.backgroundColorName) : null;

  const handleViewUserStatuses = useCallback((userId: string) => {
    const userStatusesToView = otherUsersGroupedStatuses[userId] || [];
    if (userStatusesToView.length > 0) {
      setViewingUserAllStatuses([...userStatusesToView]); // Pass sorted (newest first)
      setViewingUserInitialStatusIndex(0); 
    }
  }, [otherUsersGroupedStatuses]);

  const handleViewMyStatuses = useCallback(() => {
    if (currentUserActiveStatuses.length > 0) {
      setViewingUserAllStatuses([...currentUserActiveStatuses]); // Pass sorted (newest first)
      setViewingUserInitialStatusIndex(0);
    } else {
      setIsCreatingTextStatus(true); 
    }
  }, [currentUserActiveStatuses]);

  const handleDeleteStatusInView = useCallback((statusIdToDelete: string) => {
    onDeleteUserStatus(statusIdToDelete); 
    setViewingUserAllStatuses(prev => {
        if (!prev) return null;
        const updated = prev.filter(s => s.id !== statusIdToDelete);
        if (updated.length === 0) {
             return null; // This will close ViewStatus via its own effect
        }
        return updated; // ViewStatus will adjust its internal currentIndex
    });
  }, [onDeleteUserStatus, setViewingUserAllStatuses]);


  if (!currentUser) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-muted-foreground">
        Memuat status pengguna...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background h-full relative">
      <header className="flex items-center justify-between p-4 py-3 sticky top-0 bg-background z-10 border-b">
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
        <div className="p-4 space-y-5">
          <div>
            <h2 className="text-md font-semibold mb-1.5 text-foreground">Status</h2>
            <div
              className="flex items-center space-x-3 cursor-pointer md:hover:bg-muted/30 p-1.5 -ml-1.5 rounded-lg"
              onClick={handleViewMyStatuses}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={currentUser.avatarUrl} alt="My Status Avatar" data-ai-hint="person abstract"/>
                  <AvatarFallback>{getInitials(currentUser.name, 2)}</AvatarFallback>
                </Avatar>
                {!hasMyStatus ? (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-background flex items-center justify-center">
                        <Plus className="h-3 w-3 text-white" />
                    </div>
                ) : (
                   myLatestStatusThemeClasses && (
                    <div className={cn(
                      "absolute -bottom-1 -right-1 rounded-full p-0.5 flex items-center justify-center border-2 border-background",
                       myLatestStatusThemeClasses.bg // Use the theme background for the dot itself
                    )}>
                      {/* The inner div is purely for sizing if needed, or can be removed if p-0.5 on parent is enough */}
                       <div className={cn("h-3 w-3 rounded-full")} />
                    </div>
                   )
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                    {hasMyStatus ? "Status Saya" : "Tambah Status"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {hasMyStatus && myLatestStatus
                    ? `${currentUserActiveStatuses.length} pembaruan • ${formatTimestamp(myLatestStatus.timestamp)}`
                    : "Akan hilang setelah 24 jam"}
                </p>
              </div>
            </div>
          </div>

          {otherUsersLatestStatus.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground mb-2 tracking-wide">PEMBARUAN TERKINI</h2>
              <div className="space-y-0.5">
                {otherUsersLatestStatus.map(status => {
                    const allStatusesForThisUser = otherUsersGroupedStatuses[status.userId] || [];
                    const unreadCount = allStatusesForThisUser.length; 

                    return (
                        <div 
                          key={status.id} 
                          className="flex items-center space-x-3 cursor-pointer md:hover:bg-muted/30 p-1.5 -ml-1.5 rounded-lg"
                          onClick={() => handleViewUserStatuses(status.userId)}
                        >
                            <div className={cn(
                                "relative p-0.5 rounded-full",
                                "bg-gradient-to-tr from-green-400 to-emerald-600"
                            )}>
                                <Avatar className="h-12 w-12 border-2 border-background">
                                <AvatarImage src={status.userAvatarUrl} alt={status.userName} data-ai-hint="person abstract status"/>
                                <AvatarFallback>{getInitials(status.userName, 2)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{status.userName}</p>
                                <div className="flex items-center space-x-1.5">
                                    <p className="text-xs text-muted-foreground truncate">{formatTimestamp(status.timestamp)}</p>
                                    {unreadCount > 1 && (
                                      <span className="text-xs text-muted-foreground">&bull; {unreadCount} baru</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
              </div>
            </div>
          )}
           {otherUsersLatestStatus.length === 0 && activeUserStatuses.length > 0 && currentUserActiveStatuses.length === activeUserStatuses.length && (
             <div className="pt-8 text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Belum ada pembaruan dari pengguna lain.</p>
                <p className="mt-1 text-xs text-muted-foreground/80">Mulai chat dengan teman untuk melihat status mereka.</p>
            </div>
           )}
           {activeUserStatuses.length === 0 && (
             <div className="pt-8 text-center">
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
            className="rounded-2xl h-12 w-12 shadow-lg bg-card md:hover:bg-muted focus-visible:ring-gray-400"
            onClick={() => setIsCreatingTextStatus(true)}
            aria-label="Buat status teks"
          >
            <Pencil className="h-5 w-5 text-foreground/90" />
         </Button>
         <Button
            variant="default"
            size="icon"
            className="rounded-2xl h-14 w-14 shadow-lg bg-green-500 md:hover:bg-green-600 text-white focus-visible:ring-green-300"
            aria-label="Buat status foto atau video"
            onClick={() => alert("Fitur status foto/video akan segera hadir!")}
          >
            <Camera className="h-6 w-6" />
         </Button>
      </div>

      {isCreatingTextStatus && currentUser && (
        <CreateTextStatus
          currentUser={currentUser}
          onClose={() => setIsCreatingTextStatus(false)}
          onPostStatus={handlePostUserStatus}
        />
      )}

      {viewingUserAllStatuses && viewingUserAllStatuses.length > 0 && currentUser && (
        <ViewStatus
          statuses={viewingUserAllStatuses}
          initialStatusIndex={viewingUserInitialStatusIndex}
          onClose={() => {
            setViewingUserAllStatuses(null);
            setViewingUserInitialStatusIndex(0);
          }}
          currentUser={currentUser}
          onDeleteStatus={handleDeleteStatusInView}
        />
      )}
    </div>
  );
}

