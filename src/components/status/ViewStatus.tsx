
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { User, UserStatus } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusThemeClasses } from '@/config/statusThemes';
import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';

const STATUS_VIEW_DURATION = 5000; // 5 seconds

interface ViewStatusProps {
  statuses: UserStatus[]; // Should be sorted OLDEST first by parent for viewer
  initialStatusIndex?: number;
  onClose: () => void;
  currentUser: User | null;
  onDeleteStatus?: (statusId: string) => void;
  onMarkAsRead: (latestTimestampViewed: number) => void;
}

export function ViewStatus({
  statuses,
  initialStatusIndex = 0,
  onClose,
  currentUser,
  onDeleteStatus,
  onMarkAsRead,
}: ViewStatusProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStatusIndex);
  const [progressValue, setProgressValue] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevCurrentStatusRef = useRef<UserStatus | null>(null);

  const currentStatus = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < statuses.length) {
      return statuses[currentIndex];
    }
    return null;
  }, [statuses, currentIndex]);

  const themeClasses = useMemo(() => getStatusThemeClasses(currentStatus?.backgroundColorName), [currentStatus]);
  
  useEffect(() => {
    prevCurrentStatusRef.current = currentStatus;
  }, [currentStatus]);


  const getInitials = (name: string | undefined, length: number = 1) => {
    if (!name) return "?";
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, length).toUpperCase();
    if (length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + (names.length > 1 ? names[names.length - 1][0].toUpperCase() : "");
  };

  const formatTimestampForView = (timestamp: number): string => {
    const date = new Date(timestamp);
    try {
      const now = new Date();
      const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
      const diffMinutes = Math.round(diffSeconds / 60);
      const diffHours = Math.round(diffMinutes / 60);

      if (diffSeconds < 60) return `${diffSeconds} dtk lalu`;
      if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;   
      if (isYesterday(date)) return `Kemarin, ${format(date, "HH:mm", { locale: idLocale })}`;
      return format(date, "d MMM, HH:mm", { locale: idLocale });
    } catch (e) {
      return format(date, "PPpp", { locale: idLocale });
    }
  };
  
  const performCloseActions = useCallback(() => {
    // Mark the currently displayed status as read when closing
    if (currentStatus) {
        onMarkAsRead(currentStatus.timestamp);
    }
    queueMicrotask(() => onClose());
  }, [onClose, currentStatus, onMarkAsRead]);


  const advanceToStatus = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < statuses.length) {
      setCurrentIndex(newIndex);
    } else if (newIndex >= statuses.length) { 
      // This means we've advanced past the last status.
      // The onMarkAsRead for the *last* status would have been called by the timer/nav that led to this state.
      // So, just perform close actions.
      performCloseActions();
    }
  }, [statuses.length, performCloseActions]);


  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!currentStatus) {
      if (statuses.length > 0 && prevCurrentStatusRef.current !== null) { // Only close if it was previously showing something
          performCloseActions();
      } else if (statuses.length === 0 && prevCurrentStatusRef.current !== null) {
          performCloseActions();
      }
      return;
    }
    
    setProgressValue(0); 

    intervalRef.current = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 100;
        }
        return prev + (100 / (STATUS_VIEW_DURATION / 100));
      });
    }, 100);

    timerRef.current = setTimeout(() => {
      if (currentStatus) {
         onMarkAsRead(currentStatus.timestamp); 
      }
      advanceToStatus(currentIndex + 1);    
    }, STATUS_VIEW_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, currentStatus, statuses, onMarkAsRead, advanceToStatus, performCloseActions]);


  const handleManualNavigation = useCallback((direction: 'next' | 'prev') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgressValue(0); 

    const statusBeingLeft = statuses[currentIndex];

    if (direction === 'next') {
      if (statusBeingLeft) {
        onMarkAsRead(statusBeingLeft.timestamp); 
      }
      advanceToStatus(currentIndex + 1);
    } else { 
      // When going to 'prev', we don't mark the (newer) one we are leaving as read.
      // Its timer was interrupted. The `lastReadTimestamp` should reflect the
      // furthest *completed or explicitly closed on* status.
      advanceToStatus(currentIndex - 1);
    }
  }, [currentIndex, statuses, onMarkAsRead, advanceToStatus]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        performCloseActions();
      } else if (event.key === 'ArrowRight') {
        handleManualNavigation('next');
      } else if (event.key === 'ArrowLeft') {
        handleManualNavigation('prev');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [performCloseActions, handleManualNavigation]);


  useEffect(() => {
    // This effect handles scenarios where the 'statuses' prop array changes externally (e.g., due to deletion)
    if (statuses.length === 0 && prevCurrentStatusRef.current !== null) { 
      performCloseActions();
    } else if (currentIndex >= statuses.length && statuses.length > 0) {
      // If current index is out of bounds (e.g. last status deleted), try to go to the new last status
      setCurrentIndex(statuses.length - 1);
    } else if (currentIndex < 0 && statuses.length > 0) { 
      // Should not happen with current logic, but as a safeguard
      setCurrentIndex(0);
    }
  }, [statuses, currentIndex, performCloseActions]);


  if (!currentStatus) {
    // This can happen briefly if statuses array becomes empty after a delete
    // The useEffect above should handle closing the viewer.
    return null; 
  }

  const handleDeleteClick = () => {
    if (currentUser && currentStatus.userId === currentUser.id && onDeleteStatus) {
      // Clear timers before deletion to prevent issues with state updates post-unmount/change
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      onDeleteStatus(currentStatus.id);
      // The parent (StatusPage) will update `viewingUserAllStatuses`,
      // which will trigger the useEffect in this component to re-evaluate currentIndex or close.
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex flex-col items-center justify-center transition-colors duration-300",
        themeClasses.bg
      )}
    >
      <div
        className="absolute top-0 left-0 h-full w-1/3 z-10"
        onClick={() => handleManualNavigation('prev')}
        aria-label="Status Sebelumnya"
      />
      <div
        className="absolute top-0 right-0 h-full w-1/3 z-10"
        onClick={() => handleManualNavigation('next')}
        aria-label="Status Berikutnya"
      />

      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 z-20 bg-gradient-to-b from-black/50 via-black/30 to-transparent">
        <div className="flex items-center gap-1 mb-2">
          {statuses.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/40 rounded-full overflow-hidden">
              {index === currentIndex ? (
                <Progress value={progressValue} className="h-full bg-white transition-all duration-100 ease-linear" />
              ) : index < currentIndex ? (
                <div className="h-full bg-white rounded-full" /> 
              ) : null }
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-9 w-9 border-2 border-white/80">
              <AvatarImage src={currentStatus.userAvatarUrl} alt={currentStatus.userName} data-ai-hint="person abstract"/>
              <AvatarFallback className="text-black bg-white/80">{getInitials(currentStatus.userName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white text-sm leading-tight">{currentStatus.userName}</p>
              <p className="text-xs text-white/80 leading-tight">{formatTimestampForView(currentStatus.timestamp)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {currentUser && currentStatus.userId === currentUser.id && onDeleteStatus && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteClick}
                className="text-white rounded-full hover:bg-white/20"
                aria-label="Hapus Status"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={performCloseActions} className="text-white rounded-full hover:bg-white/20">
              <X className="h-6 w-6" />
              <span className="sr-only">Tutup</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex w-full items-center justify-center overflow-hidden px-4 pb-10 pt-20 md:pt-24">
        <p
          className={cn(
            "text-center text-3xl md:text-4xl lg:text-5xl font-medium break-words w-full max-w-2xl",
            themeClasses.text,
          )}
          style={{ lineHeight: '1.4' }}
        >
          {currentStatus.content}
        </p>
      </div>
    </div>
  );
}

