
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, UserStatus } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'; // Using ShadCN Progress
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusThemeClasses } from '@/config/statusThemes';
import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';

const STATUS_VIEW_DURATION = 5000; // 5 seconds

interface ViewStatusProps {
  statuses: UserStatus[]; // All statuses for the viewed user, sorted newest to oldest
  initialStatusIndex?: number; // Index of the status to show first
  onClose: () => void;
  // currentUser: User; // For potential future reply functionality
}

export function ViewStatus({
  statuses,
  initialStatusIndex = 0,
  onClose,
}: ViewStatusProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStatusIndex);
  const [progressValue, setProgressValue] = useState(0);

  const currentStatus = useMemo(() => statuses[currentIndex], [statuses, currentIndex]);
  const themeClasses = useMemo(() => getStatusThemeClasses(currentStatus?.backgroundColorName), [currentStatus]);

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

  const goToNextStatus = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex < statuses.length - 1) {
        return prevIndex + 1;
      }
      onClose(); // Close if it's the last status
      return prevIndex; // Keep current index if closing, or it might error before unmount
    });
  }, [statuses.length, onClose]);

  const goToPrevStatus = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex > 0) {
        return prevIndex - 1;
      }
      return prevIndex; // Stay at the first status
    });
  }, []);

  useEffect(() => {
    setProgressValue(0); // Reset progress when status changes
    const interval = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / (STATUS_VIEW_DURATION / 100)); // Increment to fill in STATUS_VIEW_DURATION
      });
    }, 100); // Update progress every 100ms

    const timer = setTimeout(() => {
      goToNextStatus();
    }, STATUS_VIEW_DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [currentIndex, goToNextStatus]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
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


  if (!currentStatus) {
    return null; // Should not happen if statuses array is not empty
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex flex-col items-center justify-center transition-colors duration-300",
        themeClasses.bg // Background of the entire view takes the status theme
      )}
    >
      {/* Navigation Areas */}
      <div
        className="absolute top-0 left-0 h-full w-1/3 z-10"
        onClick={goToPrevStatus}
      />
      <div
        className="absolute top-0 right-0 h-full w-1/3 z-10"
        onClick={goToNextStatus}
      />

      {/* Top Bar: Progress, User Info, Close */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 z-20 bg-gradient-to-b from-black/50 via-black/30 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          {statuses.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/40 rounded-full overflow-hidden">
              {index === currentIndex ? (
                <Progress value={progressValue} className="h-1 bg-white transition-all duration-100 ease-linear" />
              ) : index < currentIndex ? (
                <div className="h-1 bg-white rounded-full" />
              ) : null}
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
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white rounded-full hover:bg-white/20">
            <X className="h-6 w-6" />
            <span className="sr-only">Tutup</span>
          </Button>
        </div>
      </div>

      {/* Content Area */}
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
       {/* Optional: Reply button placeholder - not functional yet
       <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex justify-center">
        <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 text-xs">
          <MessageCircle className="mr-2 h-4 w-4" /> Balas
        </Button>
      </div>
      */}
    </div>
  );
}
