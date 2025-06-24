
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { User, UserStatus, RegisteredUser } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { X, Trash2, SendHorizonal, Heart, ChevronDown, Eye } from 'lucide-react';
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
  onMarkAsReadGeneral: (viewedUserId: string, latestTimestampViewed: number) => void;
  onRecordSingleStatusView: (statusId: string) => void;
  onOpenSeenByDialog: (status: UserStatus) => void;
  registeredUsers: RegisteredUser[];
}

export function ViewStatus({
  statuses,
  initialStatusIndex = 0,
  onClose,
  currentUser,
  onDeleteStatus,
  onMarkAsReadGeneral,
  onRecordSingleStatusView,
  onOpenSeenByDialog,
  registeredUsers,
}: ViewStatusProps) {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(initialStatusIndex);
  const [progressValue, setProgressValue] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isPaused, setIsPaused] = useState(false);
  const progressAtPauseRef = useRef<number>(0);
  const navLeftRef = useRef<HTMLDivElement>(null);
  const navRightRef = useRef<HTMLDivElement>(null);

  const [isReplyingMode, setIsReplyingMode] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplyInputFocused, setIsReplyInputFocused] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const replyAreaRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const replyAreaTouchStartYRef = useRef<number | null>(null);
  const isSwipingOnReplyAreaRef = useRef<boolean>(false);
  const prevCurrentStatusRef = useRef<UserStatus | null>(null);

  const currentStatus = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < statuses.length) {
      return statuses[currentIndex];
    }
    return null;
  }, [statuses, currentIndex]);

  const themeClasses = useMemo(() => getStatusThemeClasses(currentStatus?.backgroundColorName), [currentStatus]);

  const handleCancelReply = useCallback(() => {
    if (replyInputRef.current && isReplyInputFocused) {
      replyInputRef.current.blur(); 
    }
    setIsReplyingMode(false);
    setReplyText('');
    setIsReplyInputFocused(false);
    if (isPaused) { 
        setIsPaused(false); 
    }
  }, [isPaused, isReplyInputFocused]);


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
    
    onMarkAsReadGeneral(statusBeingRepliedTo.userId, statusBeingRepliedTo.timestamp);
    
    performCloseActions(); // Close view after sending reply
  }, [replyText, currentStatus, toast, handleCancelReply, onMarkAsReadGeneral]);


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
      handleCancelReply(); // This will also unpause if needed
      return; 
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (currentStatus) {
      onMarkAsReadGeneral(currentStatus.userId, currentStatus.timestamp);
    }
    queueMicrotask(() => onClose());
  }, [onClose, isReplyingMode, handleCancelReply, currentStatus, onMarkAsReadGeneral]);


  const advanceToStatus = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < statuses.length) {
      setCurrentIndex(newIndex);
      setProgressValue(0);
      progressAtPauseRef.current = 0;
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
      if (currentUser && currentStatus.userId !== currentUser.id) {
        onRecordSingleStatusView(currentStatus.id);
      }
      onMarkAsReadGeneral(currentStatus.userId, currentStatus.timestamp);
      advanceToStatus(currentIndex + 1);
      if(resumeFromPercent === 0) {
          progressAtPauseRef.current = 0;
      }
      return;
    }

    const progressToDo = 100 - effectiveInitialProgress;
    const intervalsCount = remainingDuration / 100;
    const incrementPerInterval = intervalsCount > 0 ? progressToDo / intervalsCount : progressToDo;


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
      setProgressValue(100);
      if (currentUser && currentStatus.userId !== currentUser.id) {
        onRecordSingleStatusView(currentStatus.id);
      }
      onMarkAsReadGeneral(currentStatus.userId, currentStatus.timestamp);
      advanceToStatus(currentIndex + 1);
    }, remainingDuration);

    if(resumeFromPercent === 0){
        progressAtPauseRef.current = 0;
    }

  }, [currentStatus, onMarkAsReadGeneral, advanceToStatus, currentIndex, currentUser, onRecordSingleStatusView]);

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

    if (isPaused || isReplyingMode) { 
      return;
    }

    startTimers(progressAtPauseRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, currentStatus, statuses, isPaused, isReplyingMode, startTimers, performCloseActions]);


  const handleManualNavigation = useCallback((direction: 'next' | 'prev') => {
    if (isReplyingMode) return; 

    const statusBeingLeft = statuses[currentIndex];
    if (statusBeingLeft) {
       onMarkAsReadGeneral(statusBeingLeft.userId, statusBeingLeft.timestamp);
       if (currentUser && statusBeingLeft.userId !== currentUser.id && direction === 'next') {
         onRecordSingleStatusView(statusBeingLeft.id);
       }
    }
    
    if (direction === 'next') {
      advanceToStatus(currentIndex + 1);
    } else {
      advanceToStatus(currentIndex - 1);
    }
  }, [currentIndex, statuses, onMarkAsReadGeneral, advanceToStatus, isReplyingMode, currentUser, onRecordSingleStatusView]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        performCloseActions();
      } else if (!isReplyingMode && !isReplyInputFocused) {
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
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      onDeleteStatus(currentStatus.id);
    }
  };

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as Node;
     if (isReplyingMode ||
        navLeftRef.current?.contains(target) ||
        navRightRef.current?.contains(target) ||
        replyAreaRef.current?.contains(target) || // Check if touch started on replyArea itself
        (event.target as HTMLElement).closest('button') ||
        (event.target as HTMLElement).closest('textarea')
       ) {
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
    if (isPaused && !isReplyingMode) { 
      setIsPaused(false);
    }
  }, [isPaused, isReplyingMode]);


 const handleReplyAreaTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.touches.length === 1) {
      replyAreaTouchStartYRef.current = e.targetTouches[0].clientY;
      isSwipingOnReplyAreaRef.current = true;

      if (!isPaused && !isReplyingMode) {
          setIsPaused(true);
          progressAtPauseRef.current = progressValue;
          if (timerRef.current) clearTimeout(timerRef.current);
          if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }
  };

  const handleReplyAreaTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isSwipingOnReplyAreaRef.current) {
      e.stopPropagation();
    }
  };

  const handleReplyAreaTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    let unpausedDueToNoAction = false;

    if (replyAreaTouchStartYRef.current && isSwipingOnReplyAreaRef.current && currentStatus && currentUser) {
      const touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = replyAreaTouchStartYRef.current - touchEndY;

      if (swipeDistance > MIN_SWIPE_UP_DISTANCE_REPLY_AREA) {
        if (currentStatus.userId === currentUser.id) {
          onOpenSeenByDialog(currentStatus);
          // Don't set isReplyingMode true, keep timer paused (dialog will overlay)
        } else if (!isReplyingMode) {
          setIsReplyingMode(true);
          setIsReplyInputFocused(true);
          setTimeout(() => replyInputRef.current?.focus(), 50);
          // Timer remains paused due to isReplyingMode = true
        }
      } else if (isReplyingMode && swipeDistance < -MIN_SWIPE_UP_DISTANCE_REPLY_AREA) {
        handleCancelReply(); // This will unpause if appropriate
      } else if (!isReplyingMode && isPaused) {
         setIsPaused(false); // Unpause if swipe was not enough and not in reply mode
         unpausedDueToNoAction = true;
      }
    }
    replyAreaTouchStartYRef.current = null;
    isSwipingOnReplyAreaRef.current = false;
    
    // Explicitly unpause if no action taken and was paused by this area's touch start
    if (unpausedDueToNoAction && !isReplyingMode && isPaused) {
        setIsPaused(false);
    }
  };


  if (!currentStatus) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex flex-col items-center justify-center transition-colors duration-300 select-none bg-background", // Base background
        themeClasses.bg // Theme-specific background on top
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp} 
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
                <Progress
                  value={isPaused || isReplyingMode ? progressAtPauseRef.current : progressValue}
                  className="h-full bg-transparent" 
                  indicatorClassName="bg-white transition-transform duration-100 ease-linear" 
                />
              ) : index < currentIndex ? (
                <div className="h-full bg-white rounded-full" /> 
              ) : null }
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center space-x-2">
            <Avatar className="h-12 w-12 border-2 border-white/80">
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
                onClickCapture={(e) => { handleDeleteClick(); e.stopPropagation(); }}
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
          isReplyingMode && currentStatus.userId !== currentUser?.id && "opacity-70"
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
      
      {/* Clickable "Seen By" indicator for own status */}
      {currentUser && currentStatus.userId === currentUser.id && (
        <div 
          className="absolute bottom-0 left-0 right-0 z-30 flex justify-center items-center p-3 pointer-events-auto"
        >
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5",
              themeClasses.text, 
              "bg-black/30 hover:bg-black/50 backdrop-blur-sm"
            )}
            onClickCapture={(e) => {
              e.stopPropagation(); 
              onOpenSeenByDialog(currentStatus);
            }}
            onTouchStart={(e) => e.stopPropagation()} 
          >
            <Eye className="h-4 w-4" />
            <span>{currentStatus.seenBy?.length || 0}</span>
          </Button>
        </div>
      )}

      {/* Swipe-up area and Reply Panel (only for others' status or own status) */}
      {currentUser && (
        <div
            ref={replyAreaRef}
            className={cn(
                "absolute bottom-0 left-0 right-0 z-20 overflow-hidden",
                "flex flex-col items-center",
                "transition-[height,background-color] duration-300 ease-out",
                "pointer-events-auto",
                isReplyingMode && currentStatus.userId !== currentUser.id ? "bg-black/90 h-auto" : "bg-transparent h-[40vh]"
            )}
            onTouchStart={handleReplyAreaTouchStart}
            onTouchMove={handleReplyAreaTouchMove}
            onTouchEnd={handleReplyAreaTouchEnd}
        >
            <div
                ref={contentWrapperRef}
                className={cn(
                    "w-full transition-transform duration-300 ease-out",
                    isReplyingMode && currentStatus.userId !== currentUser.id ? "translate-y-0" : "translate-y-full"
                )}
            >
                {/* This content only shows for replying to others */}
                {isReplyingMode && currentStatus.userId !== currentUser.id && (
                    <>
                        <div
                            className="flex flex-col items-center justify-center text-center w-full cursor-pointer py-2"
                            onClick={(e) => { e.stopPropagation(); handleCancelReply(); }}
                            onTouchStart={(e) => e.stopPropagation()}
                        >
                            <ChevronDown className="h-5 w-5 text-neutral-400" />
                        </div>
                        <div className="w-full max-w-xl mx-auto px-3 pb-3 pt-1">
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
                                    onClick={(e) => e.stopPropagation()} 
                                    onTouchStart={(e) => e.stopPropagation()}
                                />
                                {isReplyInputFocused || replyText.trim() ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="bg-sky-600 hover:bg-sky-500 rounded-full h-10 w-10 p-0 shrink-0"
                                    onClick={(e) => { e.stopPropagation(); handleSendReply(); }}
                                    disabled={!replyText.trim()}
                                    aria-label="Kirim balasan"
                                    onTouchStart={(e) => e.stopPropagation()} 
                                >
                                    <SendHorizonal className="h-5 w-5 text-white" />
                                </Button>
                                ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="bg-neutral-700 hover:bg-neutral-600 rounded-full h-10 w-10 p-0 shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        toast({ title: `Status ${currentStatus.userName} disukai!`});
                                    }}
                                    aria-label="Sukai status"
                                    onTouchStart={(e) => e.stopPropagation()} 
                                >
                                    <Heart className="h-5 w-5 text-white" />
                                </Button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
}



    