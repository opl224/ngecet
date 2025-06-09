
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { User, UserStatus } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { X, Trash2, SendHorizonal, Heart, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusThemeClasses } from '@/config/statusThemes';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
import { useToast } from '@/hooks/use-toast';

const STATUS_VIEW_DURATION = 5000; // 5 seconds
const MIN_SWIPE_UP_DISTANCE = 50;

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
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(initialStatusIndex);
  const [progressValue, setProgressValue] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevCurrentStatusRef = useRef<UserStatus | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const progressAtPauseRef = useRef<number>(0);
  const navLeftRef = useRef<HTMLDivElement>(null);
  const navRightRef = useRef<HTMLDivElement>(null);

  // States for reply UI
  const [isReplyingMode, setIsReplyingMode] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplyInputFocused, setIsReplyInputFocused] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  // Refs for swipe-up gesture
  const touchStartYRef = useRef<number | null>(null);
  const isSwipingToReplyRef = useRef<boolean>(false);


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

  const handleCancelReply = useCallback(() => {
    setIsReplyingMode(false);
    setReplyText('');
    setIsReplyInputFocused(false);
    if (isPaused && !isSwipingToReplyRef.current) { // Resume only if pause was due to reply mode
      setIsPaused(false); // This will trigger useEffect to resume timers
    }
  }, [isPaused]);

  const performCloseActions = useCallback(() => {
    if (isReplyingMode) {
      handleCancelReply(); // Close reply mode first
      // Do not close the whole status viewer yet, allow user to resume viewing
      // If they click X again, then it will close.
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    // onMarkAsRead is handled by timer completion or manual navigation
    queueMicrotask(() => onClose());
  }, [onClose, isReplyingMode, handleCancelReply]);


  const advanceToStatus = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < statuses.length) {
      setCurrentIndex(newIndex);
      setProgressValue(0); // Reset progress for new status
      progressAtPauseRef.current = 0; // Reset pause ref as well
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
      onMarkAsRead(currentStatus.timestamp);
      advanceToStatus(currentIndex + 1);
      if (resumeFromPercent === 0) { 
          progressAtPauseRef.current = 0;
      }
      return;
    }

    const progressToDo = 100 - effectiveInitialProgress;
    const intervalsCount = remainingDuration / 100; // Number of 100ms intervals
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
      onMarkAsRead(currentStatus.timestamp);
      advanceToStatus(currentIndex + 1);
    }, remainingDuration);
    
    if (resumeFromPercent === 0) {
        progressAtPauseRef.current = 0; 
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

    if (isPaused || isReplyingMode) { // Also pause if in replying mode
      return;
    }

    startTimers(progressAtPauseRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, currentStatus, statuses, isPaused, isReplyingMode, startTimers, performCloseActions]);


  const handleManualNavigation = useCallback((direction: 'next' | 'prev') => {
    if (isPaused && !isReplyingMode) return; 
    if (isReplyingMode) return; // Prevent navigation while actively replying

    const statusBeingLeft = statuses[currentIndex];
    if (direction === 'next') {
      if (statusBeingLeft) {
        onMarkAsRead(statusBeingLeft.timestamp);
      }
      advanceToStatus(currentIndex + 1);
    } else {
      // When going to prev, we don't mark the one we are coming from as read immediately
      // It will be marked if its timer completes or if navigated past again
      advanceToStatus(currentIndex - 1);
    }
  }, [currentIndex, statuses, onMarkAsRead, advanceToStatus, isPaused, isReplyingMode]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isReplyingMode) {
          handleCancelReply();
        } else {
          performCloseActions();
        }
      } else if (!isReplyingMode && !isReplyInputFocused) { // Allow arrow keys only if not typing reply
        if (event.key === 'ArrowRight') {
          handleManualNavigation('next');
        } else if (event.key === 'ArrowLeft') {
          handleManualNavigation('prev');
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [performCloseActions, handleManualNavigation, isReplyingMode, isReplyInputFocused, handleCancelReply]);

  const handleDeleteClick = () => {
    if (currentUser && currentStatus && currentStatus.userId === currentUser.id && onDeleteStatus) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      onDeleteStatus(currentStatus.id);
      // ViewStatus will close if statuses array becomes empty or currentIndex is out of bounds
    }
  };

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as Node;
    if (isReplyingMode || // Don't interfere if in reply mode
        navLeftRef.current?.contains(target) || 
        navRightRef.current?.contains(target) ||
        (event.target as HTMLElement).closest('button')) { 
      return;
    }

    if (!isPaused) {
      setIsPaused(true);
      progressAtPauseRef.current = progressValue;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isPaused, progressValue, isReplyingMode]);

  const handlePointerUp = useCallback(() => {
    // Don't resume if we are in reply mode, reply mode handles its own pause
    if (isPaused && !isReplyingMode) { 
      setIsPaused(false); 
    }
  }, [isPaused, isReplyingMode]);

  // Swipe Up to Reply Handlers
  const handleTouchStartReply = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && !isReplyingMode) {
      touchStartYRef.current = e.targetTouches[0].clientY;
      isSwipingToReplyRef.current = true;
      // Optimistically pause while checking for swipe
      if (!isPaused) {
          setIsPaused(true);
          progressAtPauseRef.current = progressValue;
          if (timerRef.current) clearTimeout(timerRef.current);
          if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }
  };

  const handleTouchEndReply = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current && isSwipingToReplyRef.current && !isReplyingMode) {
      const touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = touchStartYRef.current - touchEndY;

      if (swipeDistance > MIN_SWIPE_UP_DISTANCE) {
        setIsReplyingMode(true);
        // setIsPaused is already true from touchStart
        // No need to focus here, the placeholder click will handle it
      } else {
        // Not a valid swipe up, resume if it was paused by this attempt
        if (isPaused && isSwipingToReplyRef.current) {
            setIsPaused(false);
        }
      }
    }
    touchStartYRef.current = null;
    isSwipingToReplyRef.current = false;
  };
  
  const handleSendReply = useCallback(() => {
    if (!replyText.trim() || !currentStatus) return;
    toast({
      title: `Balasan terkirim ke ${currentStatus.userName}`,
      description: replyText,
    });
    handleCancelReply(); // Reset reply mode
    performCloseActions(); // Close status viewer after sending
  }, [replyText, currentStatus, toast, handleCancelReply, performCloseActions]);


  if (!currentStatus) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex flex-col items-center justify-center transition-colors duration-300 select-none",
        themeClasses.bg
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} 
      onTouchStart={handleTouchStartReply}
      onTouchEnd={handleTouchEndReply}
    >
      <div
        ref={navLeftRef}
        className="absolute top-0 left-0 h-full w-1/3 z-10"
        onClickCapture={(e) => { if (!isPaused && !isReplyingMode) handleManualNavigation('prev'); e.stopPropagation();}}
        aria-label="Status Sebelumnya"
      />
      <div
        ref={navRightRef}
        className="absolute top-0 right-0 h-full w-1/3 z-10"
        onClickCapture={(e) => { if (!isPaused && !isReplyingMode) handleManualNavigation('next'); e.stopPropagation();}}
        aria-label="Status Berikutnya"
      />

      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 z-20 bg-gradient-to-b from-black/50 via-black/30 to-transparent pointer-events-none">
        <div className="flex items-center gap-1 mb-2">
          {statuses.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/40 rounded-full overflow-hidden">
              {index === currentIndex ? (
                <Progress value={isPaused || isReplyingMode ? progressAtPauseRef.current : progressValue} className="h-full bg-transparent" indicatorClassName="bg-white transition-transform duration-100 ease-linear" />
              ) : index < currentIndex ? (
                <div className="h-full bg-white rounded-full" />
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pointer-events-auto"> 
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
            <Button variant="ghost" size="icon" onClickCapture={(e) => { performCloseActions(); e.stopPropagation();}} className="text-white rounded-full hover:bg-white/20">
              <X className="h-6 w-6" />
              <span className="sr-only">Tutup</span>
            </Button>
          </div>
        </div>
      </div>

      <div className={cn(
          "flex-1 flex w-full items-center justify-center overflow-hidden px-4 pb-10 pt-20 md:pt-24 z-0 pointer-events-none",
          isReplyingMode && "opacity-70" // Dim content when replying
        )}
      >
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

      {isReplyingMode && (
        <div 
          className="absolute bottom-0 left-0 right-0 p-3 bg-black/90 z-30 transition-transform duration-300 ease-out"
          style={{ transform: isReplyingMode ? 'translateY(0%)' : 'translateY(100%)' }}
          onClick={(e) => e.stopPropagation()} // Prevent pause/swipe on reply bar itself
        >
          <div className="max-w-xl mx-auto">
            {/* Chevron up icon to indicate swipe up was actioned - optional */}
            <div className="flex justify-center mb-1.5">
                <ChevronUp className="h-5 w-5 text-neutral-500" />
            </div>
            <div className="flex items-center space-x-2">
              {isReplyInputFocused ? (
                <Textarea 
                  ref={replyInputRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Balas ke ${currentStatus.userName}...`}
                  onBlur={() => { if(!replyText.trim()) setIsReplyInputFocused(false); }}
                  className="flex-1 bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400 rounded-2xl py-2.5 px-4 resize-none min-h-[40px] max-h-[100px] focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-sm"
                  rows={1}
                />
              ) : (
                <div 
                  className="flex-1 bg-neutral-800 text-white/70 rounded-full h-10 px-4 flex items-center cursor-text text-sm"
                  onClick={() => {
                    setIsReplyInputFocused(true);
                    setTimeout(() => replyInputRef.current?.focus(), 50);
                  }}
                >
                  Balas
                </div>
              )}

              {isReplyInputFocused ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="bg-sky-600 hover:bg-sky-500 rounded-full h-10 w-10 p-0 shrink-0" 
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  aria-label="Kirim balasan"
                >
                  <SendHorizonal className="h-5 w-5 text-white" />
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="bg-neutral-800 hover:bg-neutral-700 rounded-full h-10 w-10 p-0 shrink-0"
                  onClick={() => {
                      toast({ title: `Status ${currentStatus.userName} disukai!`});
                  }}
                  aria-label="Sukai status"
                >
                  <Heart className="h-5 w-5 text-white" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
