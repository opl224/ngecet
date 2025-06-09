
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, UserStatus } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'; 
import { X, Trash2 } from 'lucide-react'; // Added Trash2
import { cn } from '@/lib/utils';
import { getStatusThemeClasses } from '@/config/statusThemes';
import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';

const STATUS_VIEW_DURATION = 5000; // 5 seconds

interface ViewStatusProps {
  statuses: UserStatus[]; 
  initialStatusIndex?: number; 
  onClose: () => void;
  currentUser: User | null; // Added currentUser
  onDeleteStatus?: (statusId: string) => void; // Added onDeleteStatus
}

export function ViewStatus({
  statuses,
  initialStatusIndex = 0,
  onClose,
  currentUser,
  onDeleteStatus,
}: ViewStatusProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStatusIndex);
  const [progressValue, setProgressValue] = useState(0);

  const currentStatus = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < statuses.length) {
      return statuses[currentIndex];
    }
    return null;
  }, [statuses, currentIndex]);

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
      onClose(); 
      return prevIndex; 
    });
  }, [statuses.length, onClose]);

  const goToPrevStatus = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex > 0) {
        return prevIndex - 1;
      }
      return prevIndex; 
    });
  }, []);

  useEffect(() => {
    if (!currentStatus) {
      onClose();
      return;
    }
    setProgressValue(0); 
    const interval = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / (STATUS_VIEW_DURATION / 100)); 
      });
    }, 100); 

    const timer = setTimeout(() => {
      goToNextStatus();
    }, STATUS_VIEW_DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [currentIndex, goToNextStatus, currentStatus, onClose]);
  
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

  // Effect to adjust currentIndex if statuses prop changes (e.g., item deleted)
  useEffect(() => {
    if (statuses.length === 0) {
      onClose(); // Close if no statuses left
    } else if (currentIndex >= statuses.length) {
      // If current index is out of bounds (e.g. current item was last and deleted)
      setCurrentIndex(Math.max(0, statuses.length - 1)); // Go to the new last item or 0
    }
    // If the specific status at statuses[currentIndex] changed (e.g. content edit, not just list order),
    // `currentStatus` useMemo will pick it up.
  }, [statuses, currentIndex, onClose]);


  if (!currentStatus) {
    // This can happen briefly if statuses list is updated and becomes empty
    // The useEffect above should call onClose, but this is a safeguard.
    return null;
  }

  const handleDeleteClick = () => {
    if (currentUser && currentStatus.userId === currentUser.id && onDeleteStatus) {
      onDeleteStatus(currentStatus.id);
      // The parent (StatusPage) will handle updating `viewingUserAllStatuses`
      // which will cause this component to re-render with new `statuses`.
      // The useEffect for `statuses` change will then handle closing or index adjustment.
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
        onClick={goToPrevStatus}
      />
      <div
        className="absolute top-0 right-0 h-full w-1/3 z-10"
        onClick={goToNextStatus}
      />

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
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white rounded-full hover:bg-white/20">
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

