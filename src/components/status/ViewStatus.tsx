
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { User, UserStatus } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { X, Trash2, SendHorizonal, Heart, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusThemeClasses } from '@/config/statusThemes';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
import { useToast } from '@/hooks/use-toast';

const STATUS_VIEW_DURATION = 5000; // 5 seconds
const MIN_SWIPE_UP_DISTANCE_REPLY_AREA = 50;


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

  const [isReplyingMode, setIsReplyingMode] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplyInputFocused, setIsReplyInputFocused] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const replyAreaRef = useRef<HTMLDivElement>(null);
  const replyAreaTouchStartYRef = useRef<number | null>(null);
  const isSwipingOnReplyAreaRef = useRef<boolean>(false);

  const currentStatus = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < statuses.length) {
      return statuses[currentIndex];
    }
    return null;
  }, [statuses, currentIndex]);

  const handleCancelReply = useCallback(() => {
    setIsReplyingMode(false);
    setReplyText('');
    setIsReplyInputFocused(false);
    if (isPaused) { // Resume progress only if it was paused FOR replying
        setIsPaused(false); // This will trigger the useEffect to restart timers
    }
  }, [isPaused]);

  const handleSendReply = useCallback(() => {
    if (!replyText.trim() || !currentStatus) return;
    toast({
      title: `Balasan terkirim ke ${currentStatus.userName}`,
      description: replyText,
    });
    const statusBeingRepliedTo = currentStatus;
    handleCancelReply(); 
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onMarkAsRead(statusBeingRepliedTo.timestamp);
    onClose(); 
  }, [replyText, currentStatus, toast, handleCancelReply, onClose, onMarkAsRead]);


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
    if (isReplyingMode) {
      handleCancelReply(); // This should reset isReplyingMode and isPaused if needed
      // Do not close immediately, let cancel reply handle pause state
      return; 
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (currentStatus) { // Ensure currentStatus exists before marking as read
      onMarkAsRead(currentStatus.timestamp);
    }
    queueMicrotask(() => onClose()); // Use queueMicrotask for safer state updates before unmount
  }, [onClose, isReplyingMode, handleCancelReply, currentStatus, onMarkAsRead]);


  const advanceToStatus = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < statuses.length) {
      setCurrentIndex(newIndex);
      setProgressValue(0);
      progressAtPauseRef.current = 0; // Reset pause progress for new status
    } else if (newIndex >= statuses.length) {
      performCloseActions();
    }
    // If newIndex < 0, do nothing (already at the beginning)
  }, [statuses.length, performCloseActions]);


  const startTimers = useCallback((resumeFromPercent = 0) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!currentStatus) return; // Don't start timers if no status

    const effectiveInitialProgress = resumeFromPercent > 0 ? resumeFromPercent : 0;
    setProgressValue(effectiveInitialProgress); // Set progress immediately

    const remainingDuration = STATUS_VIEW_DURATION * (1 - (effectiveInitialProgress / 100));

    if (remainingDuration <= 0) { // If already completed or past due
      onMarkAsRead(currentStatus.timestamp);
      advanceToStatus(currentIndex + 1);
      if(resumeFromPercent === 0) { // If it was a fresh start (not a resume), ensure pause ref is reset
          progressAtPauseRef.current = 0;
      }
      return;
    }

    // Calculate how much progress is left and how many 100ms intervals that is
    const progressToDo = 100 - effectiveInitialProgress;
    const intervalsCount = remainingDuration / 100; // e.g., 5000ms / 100ms = 50 intervals
    const incrementPerInterval = intervalsCount > 0 ? progressToDo / intervalsCount : progressToDo; // Avoid division by zero


    intervalRef.current = setInterval(() => {
      setProgressValue((prev) => {
        const nextVal = prev + incrementPerInterval;
        if (nextVal >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 100;
        }
        return nextVal;
      });
    }, 100);

    timerRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgressValue(100); // Ensure it hits 100
      onMarkAsRead(currentStatus.timestamp);
      advanceToStatus(currentIndex + 1);
    }, remainingDuration);

    if(resumeFromPercent === 0){ // if this is a fresh start for this status
        progressAtPauseRef.current = 0;
    }

  }, [currentStatus, onMarkAsRead, advanceToStatus, currentIndex]);

  useEffect(() => {
    // Clear any existing timers when component mounts or critical states change
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!currentStatus) { // If no current status (e.g., statuses array is empty or index out of bounds)
      // Check if it's appropriate to close:
      // 1. If statuses became empty AND there was a previous status (meaning the last one was deleted/viewed)
      // 2. If currentIndex is out of bounds for a non-empty list (should be handled by advanceToStatus)
      if ((statuses.length === 0 && prevCurrentStatusRef.current !== null) ||
          (currentIndex >= statuses.length && statuses.length > 0 && prevCurrentStatusRef.current !== null)) {
         performCloseActions();
      }
      return; // Stop further execution if no current status
    }
    
    // If paused (due to hold or replying mode), do not start new timers.
    // Timers will be resumed when isPaused becomes false again.
    if (isPaused || isReplyingMode) {
      return;
    }

    // Start timers, resuming from `progressAtPauseRef.current` if it's > 0
    startTimers(progressAtPauseRef.current);

    // Cleanup function
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, currentStatus, statuses, isPaused, isReplyingMode, startTimers, performCloseActions]);


  const handleManualNavigation = useCallback((direction: 'next' | 'prev') => {
    if (isPaused && !isReplyingMode) return; // Prevent navigation if explicitly paused by holding, but not if paused for reply
    if (isReplyingMode) return; // Prevent navigation when reply input is active

    const statusBeingLeft = statuses[currentIndex]; // Get status before index changes
    if (direction === 'next') {
      if (statusBeingLeft) { // Mark current as read before moving to next
        onMarkAsRead(statusBeingLeft.timestamp);
      }
      advanceToStatus(currentIndex + 1);
    } else { // 'prev'
      advanceToStatus(currentIndex - 1); // No need to mark as read when going prev
    }
  }, [currentIndex, statuses, onMarkAsRead, advanceToStatus, isPaused, isReplyingMode]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        performCloseActions();
      } else if (!isReplyingMode && !isReplyInputFocused) { // Only allow arrow navigation if not replying
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
  }, [performCloseActions, handleManualNavigation, isReplyingMode, isReplyInputFocused]);

  const handleDeleteClick = () => {
    if (currentUser && currentStatus && currentStatus.userId === currentUser.id && onDeleteStatus) {
      // Pause timers before deleting
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      // isPaused = true; // Not setting state here to avoid re-render before delete logic
      onDeleteStatus(currentStatus.id); // This will cause statuses prop to update
      // ViewStatus will re-render, and useEffect will handle next/close logic
    }
  };

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    // Prevent pausing if interacting with specific elements or already in reply mode
    const target = event.target as Node;
    if (isReplyingMode || 
        navLeftRef.current?.contains(target) || 
        navRightRef.current?.contains(target) ||
        replyAreaRef.current?.contains(target) || // Prevent pause if click is on reply area itself
        (event.target as HTMLElement).closest('button') || // Or any button
        (event.target as HTMLElement).closest('textarea') // Or the textarea
       ) {
      return;
    }

    if (!isPaused) { // Only pause if not already paused
      setIsPaused(true);
      progressAtPauseRef.current = progressValue; // Store current progress
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isPaused, progressValue, isReplyingMode]);

  const handlePointerUp = useCallback(() => {
    // Resume only if it was paused by pointer down and not in replying mode
    if (isPaused && !isReplyingMode) {
      setIsPaused(false); // This will trigger useEffect to restart timers from progressAtPauseRef
    }
  }, [isPaused, isReplyingMode]);


  const handleReplyAreaTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && !(e.target as HTMLElement).closest('textarea, button')) {
      replyAreaTouchStartYRef.current = e.targetTouches[0].clientY;
      isSwipingOnReplyAreaRef.current = true; // Mark that swiping has started on reply area
    }
  };

  const handleReplyAreaTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (replyAreaTouchStartYRef.current && isSwipingOnReplyAreaRef.current) {
      const touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = replyAreaTouchStartYRef.current - touchEndY; // Positive if swipe up

      if (!isReplyingMode && swipeDistance > MIN_SWIPE_UP_DISTANCE_REPLY_AREA) {
        setIsReplyingMode(true);
        setIsPaused(true); // Pause status progress
        setIsReplyInputFocused(true); // Prepare for input
        setTimeout(() => replyInputRef.current?.focus(), 50); // Focus after state update
      } else if (isReplyingMode && swipeDistance < -MIN_SWIPE_UP_DISTANCE_REPLY_AREA) { // Swipe down
        handleCancelReply();
      }
    }
    replyAreaTouchStartYRef.current = null;
    isSwipingOnReplyAreaRef.current = false; // Reset swipe flag
  };


  if (!currentStatus) {
    // This case should ideally be handled by useEffect leading to performCloseActions
    // if statuses becomes empty or currentIndex is out of bounds.
    // Returning null here is a safeguard.
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex flex-col items-center justify-center transition-colors duration-300 select-none",
        themeClasses.bg // Theme background applied here
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} // Also resume on pointer leave
    >
      {/* Navigation areas (invisible) */}
      <div
        ref={navLeftRef}
        className="absolute top-0 left-0 h-full w-1/3 z-10" // For tapping to go previous
        onClickCapture={(e) => { if (!isPaused && !isReplyingMode) handleManualNavigation('prev'); e.stopPropagation();}}
        aria-label="Status Sebelumnya"
      />
      <div
        ref={navRightRef}
        className="absolute top-0 right-0 h-full w-1/3 z-10" // For tapping to go next
        onClickCapture={(e) => { if (!isPaused && !isReplyingMode) handleManualNavigation('next'); e.stopPropagation();}}
        aria-label="Status Berikutnya"
      />

      {/* Progress bars and Header */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 z-20 bg-gradient-to-b from-black/50 via-black/30 to-transparent pointer-events-none">
        <div className="flex items-center gap-1 mb-2">
          {statuses.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/40 rounded-full overflow-hidden">
              {index === currentIndex ? (
                <Progress
                  value={isPaused || isReplyingMode ? progressAtPauseRef.current : progressValue} // Use stored progress if paused
                  className="h-full bg-transparent" // Track is transparent
                  indicatorClassName="bg-white transition-transform duration-100 ease-linear" // Indicator style
                />
              ) : index < currentIndex ? (
                <div className="h-full bg-white rounded-full" /> // Full for already viewed
              ) : null /* Empty for not yet viewed */}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pointer-events-auto"> {/* Enable pointer events for header controls */}
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
                onClickCapture={(e) => { handleDeleteClick(); e.stopPropagation(); }} // Stop propagation
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

      {/* Status Content */}
      <div className={cn(
          "flex-1 flex w-full items-center justify-center overflow-hidden px-4 pb-10 pt-20 md:pt-24 z-0 pointer-events-none", // Ensure content is below header
          isReplyingMode && "opacity-70" // Dim content when replying
        )}
      >
        <p
          className={cn(
            "text-center text-3xl md:text-4xl lg:text-5xl font-medium break-words w-full max-w-2xl",
            themeClasses.text, // Theme text color
          )}
          style={{ lineHeight: '1.4' }}
        >
          {currentStatus.content}
        </p>
      </div>

      {/* Reply Area */}
      <div
        ref={replyAreaRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-black/90 z-30 transition-transform duration-300 ease-out",
          "flex flex-col items-center" // Ensure children are centered if they don't take full width
        )}
        style={{ 
          transform: isReplyingMode ? 'translateY(0%)' : `translateY(calc(100% - 40px - env(safe-area-inset-bottom)))`,
          // Height is auto when replying to fit content, fixed small height when peeking
          height: isReplyingMode ? 'auto' : '70px' // Increased peeking area height for better touch
        }}
        onTouchStart={handleReplyAreaTouchStart}
        onTouchEnd={handleReplyAreaTouchEnd}
        onClick={(e) => { // Click on the whole peeking area to open
          if ((e.target as HTMLElement).closest('textarea, button')) return; // Ignore if click on input/button
          if (!isReplyingMode) {
            setIsReplyingMode(true);
            setIsPaused(true);
            setIsReplyInputFocused(true);
            setTimeout(() => replyInputRef.current?.focus(), 50);
          }
        }}
      >
        {/* Chevron and "Reply to" text - This part is clickable to toggle reply mode */}
        <div
          className={cn(
            "flex flex-col items-center justify-center text-center w-full cursor-pointer",
             isReplyingMode ? "py-2" : "pt-1 pb-0.5 absolute top-0 left-0 right-0 h-[40px]" // Style for peeking vs open
          )}
          onClick={(e) => {
            e.stopPropagation(); // Stop propagation to the parent div's onClick
            if (isReplyingMode) {
              handleCancelReply();
            } else { // This case is now handled by parent onClick, but keeping for clarity/direct chevron click
              setIsReplyingMode(true);
              setIsPaused(true);
              setIsReplyInputFocused(true);
              setTimeout(() => replyInputRef.current?.focus(), 50);
            }
          }}
        >
          {isReplyingMode ? (
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronUp className="h-5 w-5 text-neutral-400" />
          )}
          {!isReplyingMode && currentStatus && ( // Show "Reply to" only when peeking
            <p className="text-xs text-neutral-400 mt-0.5">
              Balas ke {currentStatus.userName}
            </p>
          )}
        </div>

        {/* Textarea and Send/Heart button - Shown only when isReplyingMode is true */}
        {isReplyingMode && (
          <div className="w-full max-w-xl mx-auto px-3 pb-3 pt-1"> {/* Padding for the input area */}
            <div className="flex items-center space-x-2">
              <Textarea
                ref={replyInputRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Balas ke ${currentStatus.userName}...`}
                onFocus={() => setIsReplyInputFocused(true)}
                onBlur={() => { if(!replyText.trim() && !isSwipingOnReplyAreaRef.current) setIsReplyInputFocused(false); }}
                className="flex-1 bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400 rounded-2xl py-2.5 px-4 resize-none min-h-[40px] max-h-[100px] focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-neutral-500 text-sm"
                rows={1}
                onClick={(e) => e.stopPropagation()} // Prevent reply area toggle when clicking textarea
              />
              {isReplyInputFocused || replyText.trim() ? (
                <Button
                  variant="ghost" // Use ghost for custom styling
                  size="icon"
                  className="bg-sky-600 hover:bg-sky-500 rounded-full h-10 w-10 p-0 shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleSendReply(); }}
                  disabled={!replyText.trim()}
                  aria-label="Kirim balasan"
                >
                  <SendHorizonal className="h-5 w-5 text-white" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-neutral-700 hover:bg-neutral-600 rounded-full h-10 w-10 p-0 shrink-0"
                  onClick={(e) => {
                      e.stopPropagation(); // Stop propagation
                      toast({ title: `Status ${currentStatus.userName} disukai!`});
                      // Potentially, resume status or close reply after like
                      // handleCancelReply(); 
                      // setIsPaused(false); // if you want to resume immediately
                  }}
                  aria-label="Sukai status"
                >
                  <Heart className="h-5 w-5 text-white" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

    
