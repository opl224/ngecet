
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
  statuses: UserStatus[]; // Should be sorted newest first by parent
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

  const currentStatus = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < statuses.length) {
      return statuses[currentIndex];
    }
    return null;
  }, [statuses, currentIndex]);

  const themeClasses = useMemo(() => getStatusThemeClasses(currentStatus?.backgroundColorName), [currentStatus]);
  
  const prevCurrentStatusRef = useRef<UserStatus | null>(null);
  useEffect(() => {
    if (currentStatus) {
      onMarkAsRead(currentStatus.timestamp);
    }
    prevCurrentStatusRef.current = currentStatus;
  }, [currentStatus, onMarkAsRead]);


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

      if (diffSeconds < 60) return `${diffSeconds} detik yang lalu`;
      if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (isYesterday(date)) return `Kemarin, ${format(date, "HH:mm", { locale: idLocale })}`;
      return format(date, "d MMM, HH:mm", { locale: idLocale });
    } catch (e) {
      return format(date, "PPpp", { locale: idLocale });
    }
  };

  const handleCloseDeferred = () => {
    queueMicrotask(() => onClose());
  }

  const goToNextStatus = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex < statuses.length - 1) {
        return prevIndex + 1;
      }
      // If it's the last status, close
      handleCloseDeferred();
      return prevIndex; // Keep current index to avoid issues during unmount
    });
  }, [statuses.length, onClose]);

  const goToPrevStatus = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex > 0) {
        return prevIndex - 1;
      }
      return prevIndex; // Stay on the first status
    });
  }, []);

  useEffect(() => {
    // Clear any existing timers when currentStatus (or its index) changes
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!currentStatus) {
      if (statuses.length > 0) { // If statuses were there but now currentStatus is null (e.g. index out of bounds)
         handleCloseDeferred();
      }
      return;
    }
    
    setProgressValue(0); // Reset progress for new status

    intervalRef.current = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 100;
        }
        return prev + (100 / (STATUS_VIEW_DURATION / 100)); // Increment based on 100ms interval
      });
    }, 100);

    timerRef.current = setTimeout(() => {
      goToNextStatus();
    }, STATUS_VIEW_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, currentStatus, goToNextStatus, statuses.length]); // Add statuses.length

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseDeferred();
      } else if (event.key === 'ArrowRight') {
        goToNextStatus();
      } else if (event.key === 'ArrowLeft') {
        goToPrevStatus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, goToNextStatus, goToPrevStatus]);

  // Effect to handle external changes to the statuses prop (e.g., deletion)
  useEffect(() => {
    if (statuses.length === 0 && prevCurrentStatusRef.current !== null) { // Check if there was a status before
      handleCloseDeferred();
    } else if (currentIndex >= statuses.length && statuses.length > 0) {
      // If current index is out of bounds due to deletion, go to the new last status
      setCurrentIndex(statuses.length - 1);
    } else if (currentIndex < 0 && statuses.length > 0) {
      // Should not happen, but as a safeguard
      setCurrentIndex(0);
    }
  }, [statuses, currentIndex, onClose]);


  if (!currentStatus) {
    // This might be briefly hit if statuses array becomes empty after a delete
    // The useEffect above should handle closing.
    return null;
  }

  const handleDeleteClick = () => {
    if (currentUser && currentStatus.userId === currentUser.id && onDeleteStatus) {
      onDeleteStatus(currentStatus.id);
      // ViewStatus will re-render with updated statuses prop.
      // The useEffect watching `statuses` prop will handle index adjustment or closing.
    }
  };


  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex flex-col items-center justify-center transition-colors duration-300",
        themeClasses.bg
      )}
    >
      {/* Clickable areas for navigation */}
      <div
        className="absolute top-0 left-0 h-full w-1/3 z-10"
        onClick={goToPrevStatus}
        aria-label="Status Sebelumnya"
      />
      <div
        className="absolute top-0 right-0 h-full w-1/3 z-10"
        onClick={goToNextStatus}
        aria-label="Status Berikutnya"
      />

      {/* Header with progress bars, user info, and close button */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 z-20 bg-gradient-to-b from-black/50 via-black/30 to-transparent">
        <div className="flex items-center gap-1 mb-2"> {/* Reduced gap for progress bars */}
          {statuses.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/40 rounded-full overflow-hidden"> {/* Reduced height */}
              {index === currentIndex ? (
                <Progress value={progressValue} className="h-full bg-white transition-all duration-100 ease-linear" />
              ) : index < currentIndex ? (
                <div className="h-full bg-white rounded-full" /> // Filled for already seen
              ) : null /* Empty for upcoming */}
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
            <Button variant="ghost" size="icon" onClick={handleCloseDeferred} className="text-white rounded-full hover:bg-white/20">
              <X className="h-6 w-6" />
              <span className="sr-only">Tutup</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content area for the status text */}
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
