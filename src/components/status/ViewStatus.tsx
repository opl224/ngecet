
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { User, UserStatus } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusThemeClasses } from '@/config/statusThemes';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';

const STATUS_VIEW_DURATION = 5000; // 5 seconds

interface ViewStatusProps {
  statuses: UserStatus[];
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

  const [isPaused, setIsPaused] = useState(false);
  const progressAtPauseRef = useRef<number>(0);
  const navLeftRef = useRef<HTMLDivElement>(null);
  const navRightRef = useRef<HTMLDivElement>(null);


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
      return format(date, "d MMM, HH:mm", { locale: idLocale });
    } catch (e) {
      return format(date, "PPpp", { locale: idLocale });
    }
  };

  const performCloseActions = useCallback(() => {
    if (currentStatus) {
      onMarkAsRead(currentStatus.timestamp);
    }
    queueMicrotask(() => onClose());
  }, [onClose, currentStatus, onMarkAsRead]);

  const advanceToStatus = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < statuses.length) {
      setCurrentIndex(newIndex);
    } else if (newIndex >= statuses.length) {
      performCloseActions();
    }
  }, [statuses.length, performCloseActions]);


  const startTimers = useCallback((resumeFromPercent = 0) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!currentStatus) return;

    const effectiveInitialProgress = resumeFromPercent > 0 ? resumeFromPercent : 0;
    setProgressValue(effectiveInitialProgress);

    const remainingDuration = STATUS_VIEW_DURATION * (1 - (effectiveInitialProgress / 100));

    if (remainingDuration <= 0) {
      if (currentStatus) {
        onMarkAsRead(currentStatus.timestamp);
      }
      advanceToStatus(currentIndex + 1);
      if (resumeFromPercent === 0) { // Ensure reset for fresh starts that are instantaneous
          progressAtPauseRef.current = 0;
      }
      return;
    }

    const progressToDo = 100 - effectiveInitialProgress;
    const intervalsCount = remainingDuration / 100;
    const incrementPerInterval = intervalsCount > 0 ? progressToDo / intervalsCount : progressToDo;

    intervalRef.current = setInterval(() => {
      setProgressValue((prev) => {
        if (prev + incrementPerInterval >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 100;
        }
        return prev + incrementPerInterval;
      });
    }, 100);

    timerRef.current = setTimeout(() => {
      if (currentStatus) {
        onMarkAsRead(currentStatus.timestamp);
      }
      advanceToStatus(currentIndex + 1);
    }, remainingDuration);
    
    if (resumeFromPercent === 0) {
        progressAtPauseRef.current = 0; // Reset for fresh starts
    }

  }, [currentStatus, onMarkAsRead, advanceToStatus, currentIndex]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!currentStatus) {
      if ((statuses.length === 0 && prevCurrentStatusRef.current !== null) ||
          (currentIndex >= statuses.length && statuses.length > 0 && prevCurrentStatusRef.current !== null)) {
         performCloseActions();
      }
      return;
    }

    if (isPaused) {
      return;
    }

    startTimers(progressAtPauseRef.current);
    // progressAtPauseRef is reset inside startTimers if it's a fresh start

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, currentStatus, statuses, isPaused, startTimers, performCloseActions]);


  const handleManualNavigation = useCallback((direction: 'next' | 'prev') => {
    if (isPaused) return; // Don't navigate if paused, user needs to release first

    const statusBeingLeft = statuses[currentIndex];
    if (direction === 'next') {
      if (statusBeingLeft) {
        onMarkAsRead(statusBeingLeft.timestamp);
      }
      advanceToStatus(currentIndex + 1);
    } else {
      advanceToStatus(currentIndex - 1);
    }
  }, [currentIndex, statuses, onMarkAsRead, advanceToStatus, isPaused]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPaused) return; // Ignore keyboard nav if paused
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
  }, [performCloseActions, handleManualNavigation, isPaused]);

  const handleDeleteClick = () => {
    if (currentUser && currentStatus && currentStatus.userId === currentUser.id && onDeleteStatus) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      onDeleteStatus(currentStatus.id);
    }
  };

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as Node;
    // Check if the click is on the navigation divs or the close/delete buttons
    if (navLeftRef.current?.contains(target) || 
        navRightRef.current?.contains(target) ||
        (event.target as HTMLElement).closest('button')) { // also ignore if on any button (close/delete)
      return;
    }

    if (!isPaused) {
      setIsPaused(true);
      progressAtPauseRef.current = progressValue;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isPaused, progressValue]);

  const handlePointerUp = useCallback(() => {
    if (isPaused) {
      setIsPaused(false); // This triggers the useEffect to resume timers
    }
  }, [isPaused]);


  if (!currentStatus) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex flex-col items-center justify-center transition-colors duration-300 select-none", // Added select-none
        themeClasses.bg
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} // Resume if pointer leaves the screen while pressed
    >
      <div
        ref={navLeftRef}
        className="absolute top-0 left-0 h-full w-1/3 z-10"
        onClickCapture={(e) => { if (!isPaused) handleManualNavigation('prev'); e.stopPropagation();}} // onClickCapture to ensure it runs
        aria-label="Status Sebelumnya"
      />
      <div
        ref={navRightRef}
        className="absolute top-0 right-0 h-full w-1/3 z-10"
        onClickCapture={(e) => { if (!isPaused) handleManualNavigation('next'); e.stopPropagation();}} // onClickCapture
        aria-label="Status Berikutnya"
      />

      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 z-20 bg-gradient-to-b from-black/50 via-black/30 to-transparent pointer-events-none"> {/* pointer-events-none for header */}
        <div className="flex items-center gap-1 mb-2">
          {statuses.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/40 rounded-full overflow-hidden">
              {index === currentIndex ? (
                <Progress value={isPaused ? progressAtPauseRef.current : progressValue} className="h-full bg-white transition-all duration-100 ease-linear" />
              ) : index < currentIndex ? (
                <div className="h-full bg-white rounded-full" />
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pointer-events-auto"> {/* pointer-events-auto for buttons inside header */}
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
            <Button variant="ghost" size="icon" onClickCapture={(e) => { performCloseActions(); e.stopPropagation();}} className="text-white rounded-full hover:bg-white/20"> {/* onClickCapture */}
              <X className="h-6 w-6" />
              <span className="sr-only">Tutup</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex w-full items-center justify-center overflow-hidden px-4 pb-10 pt-20 md:pt-24 z-0 pointer-events-none"> {/* pointer-events-none for content area to let main div handle events */}
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
