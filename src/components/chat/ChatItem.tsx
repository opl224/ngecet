
"use client";

import type { Chat, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
import { Users, User as UserIcon, Check, X, Trash2, ShieldAlert, Clock, ShieldOff } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

interface ChatItemProps {
  chat: Chat & { calculatedUnreadCount?: number };
  currentUser: User;
  onSelectChat: (chat: Chat) => void;
  isActive: boolean;
  onAcceptChat: (chatId: string) => void;
  onRejectChat: (chatId: string) => void;
  onDeleteChatPermanently: (chatId: string) => void;
  onUnblockUser: (chatId: string) => void;
}

export function ChatItem({
  chat,
  currentUser,
  onSelectChat,
  isActive,
  onAcceptChat,
  onRejectChat,
  onDeleteChatPermanently,
  onUnblockUser,
}: ChatItemProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  const getChatDisplayDetails = () => {
    let nameForDisplay: string;
    let avatarForDisplay: string | undefined;
    let initials: string;
    let IconComponent: React.ElementType = UserIcon; // Default to UserIcon
    let otherParticipantStatus: string | undefined = undefined;
    const MAX_NAME_LENGTH = 10;

    if (chat.type === "direct") {
      const otherParticipant = chat.participants.find(p => typeof p === 'object' && p.id !== currentUser.id);
      nameForDisplay = otherParticipant?.name || "";
      avatarForDisplay = otherParticipant?.avatarUrl || chat.avatarUrl;
      otherParticipantStatus = otherParticipant?.status;
    } else {
      nameForDisplay = chat.name || "Unnamed Group";
      avatarForDisplay = chat.avatarUrl;
      IconComponent = Users;
    }

    if (nameForDisplay.length > MAX_NAME_LENGTH) {
      nameForDisplay = nameForDisplay.substring(0, MAX_NAME_LENGTH) + "...";
    }
    
    initials = (nameForDisplay ? nameForDisplay.substring(0, 2) : "??").toUpperCase();
    if (nameForDisplay.startsWith("...") && nameForDisplay.length > 2) { // if truncated name starts with ..., take next two
        initials = nameForDisplay.substring(3,5).toUpperCase() || "??";
    } else if (nameForDisplay.includes("...")) { // if ... is in middle or start for short names
        const firstMeaningfulChar = nameForDisplay.replace("...", "")[0];
        initials = (firstMeaningfulChar || "?").toUpperCase();
         if (nameForDisplay.length > 1 && nameForDisplay.replace("...", "").length > 1) {
            const secondMeaningfulChar = nameForDisplay.replace("...", "")[1];
            initials += (secondMeaningfulChar || "?").toUpperCase();
        } else if (initials.length === 1) {
            initials += (nameForDisplay.substring(0,1) || "?").toUpperCase(); // fallback to first char of original if only one meaningful
        }
    } else if (nameForDisplay) {
        initials = nameForDisplay.substring(0,2).toUpperCase();
    } else {
        initials = "??";
    }


    return { name: nameForDisplay, avatarUrl: avatarForDisplay, initials, Icon: IconComponent, otherParticipantStatus };
  };

  const { name, avatarUrl, initials, Icon, otherParticipantStatus } = getChatDisplayDetails();

  let statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
  let showAcceptRejectActions = false;
  let showDeleteAction = false;
  let specialStatusText: string | null = null;
  const calculatedUnreadCount = chat.calculatedUnreadCount || 0;
  let showPendingClockIcon = false;
  let showBlockedByCurrentUserIcon = false;

  if (chat.type === "direct") {
    if (chat.blockedByUser === currentUser.id) {
        showBlockedByCurrentUserIcon = true;
        specialStatusText = null; 
        statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
    } else if (chat.blockedByUser && chat.blockedByUser !== currentUser.id) {
        specialStatusText = `${name} mungkin memblokir Anda.`; // Name here will be truncated if long
        statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
    } else if (chat.pendingApprovalFromUserId === currentUser.id) {
      statusTimestamp = chat.requestTimestamp;
      showAcceptRejectActions = true;
      specialStatusText = "Permintaan chat baru";
    } else if (chat.pendingApprovalFromUserId) {
      showPendingClockIcon = true;
      statusTimestamp = chat.requestTimestamp;
    } else if (chat.isRejected) {
      if (chat.rejectedByUserId !== currentUser.id) {
        const rejecter = chat.participants.find(p => p.id === chat.rejectedByUserId);
        specialStatusText = `${rejecter?.name || 'Seseorang'} menolak permintaan Anda.`;
      } else {
         specialStatusText = null; 
      }
      statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
      showDeleteAction = true;
    }
  }

  const isClickDisabled =
    (chat.type === 'direct' && chat.blockedByUser && chat.blockedByUser !== currentUser.id && !isActive);


  const handleItemClick = () => {
    if (isClickDisabled) return;
    onSelectChat(chat);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isItemActiveInList = isActive &&
    !chat.pendingApprovalFromUserId &&
    !chat.isRejected &&
    !(chat.type === 'direct' && chat.blockedByUser);


  let statusMessageToDisplay: React.ReactNode = null;
  if (specialStatusText) {
    statusMessageToDisplay = specialStatusText;
  } else if (showPendingClockIcon && !chat.isRejected) {
    // No status message needed if clock icon is shown for pending sent requests
  } else if (chat.type === "group" && !chat.lastMessage && !chat.pendingApprovalFromUserId && !chat.isRejected) {
     statusMessageToDisplay = `${chat.participants.length} anggota`;
  } else if (chat.type === "direct" && !chat.lastMessage && !chat.pendingApprovalFromUserId && !chat.isRejected && !chat.blockedByUser) {
     statusMessageToDisplay = "Mulai percakapan";
  }


  return (
    <div
      onClick={handleItemClick}
      className={cn(
        "w-full text-left p-3 flex flex-col rounded-lg hover:bg-sidebar-accent transition-colors",
        isItemActiveInList ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
        isClickDisabled && "opacity-70 cursor-not-allowed",
        !isClickDisabled && "cursor-pointer"
      )}
    >
      <div
        className={cn( "w-full flex items-center space-x-3" )}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt={name || 'Chat Avatar'} data-ai-hint={chat.type === 'group' ? 'group people' : 'person abstract'}/>
          <AvatarFallback>
            {initials || <Icon className="h-5 w-5 text-sidebar-foreground/70" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="flex items-center flex-1 min-w-0 mr-2 overflow-hidden">
              {showPendingClockIcon && !chat.isRejected && (
                <Clock className="h-4 w-4 mr-1.5 text-sidebar-foreground/70 shrink-0" />
              )}
              {showBlockedByCurrentUserIcon && <ShieldAlert className="h-4 w-4 mr-1.5 text-destructive shrink-0" />}
              <h4 className={cn(      
                  "font-semibold text-sm truncate", // Keep truncate for responsive/narrow ui error                  chat.pendingApprovalFromUserId === currentUser.id && "text-primary",
                  (chat.type === 'direct' && chat.isRejected) && "text-destructive",
                  (chat.type === 'direct' && chat.blockedByUser === currentUser.id) && "text-destructive"
                )}
              >
                {name}
              </h4>
            </div>

            <div className="shrink-0">
              {(() => {
                if (showAcceptRejectActions) {
                  return (
                    <div className="flex items-center space-x-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); onRejectChat(chat.id); }}
                        className="h-7 w-7 p-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Tolak Permintaan"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); onAcceptChat(chat.id); }}
                        className="h-7 w-7 p-1 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                        aria-label="Terima Permintaan"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                }
                if (showDeleteAction) {
                  return (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); onDeleteChatPermanently(chat.id); }}
                      className="h-7 w-7 p-1 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                      aria-label="Hapus Chat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  );
                }
                if (calculatedUnreadCount > 0 && !specialStatusText) {
                  return (
                    <Badge variant="default" className="h-5 px-1.5 text-xs shrink-0">
                      {calculatedUnreadCount > 9 ? '9+' : calculatedUnreadCount}
                    </Badge>
                  );
                }

                if (chat.type === 'direct' && calculatedUnreadCount === 0 && !specialStatusText && !chat.blockedByUser && !showAcceptRejectActions && !showPendingClockIcon && !chat.isRejected) {
                  const status = otherParticipantStatus || "Offline";
                  const isOnline = status === "Online";
                  return (
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className={cn(
                        "h-2 w-2 rounded-full block",
                        isOnline ? "bg-green-500" : "bg-sidebar-foreground/30"
                      )}></span>
                      <span className="text-xs text-sidebar-foreground/70">{status}</span>
                    </div>
                  );
                }

                if (statusTimestamp && !specialStatusText && (chat.type === 'group' || (chat.type === 'direct' && !showAcceptRejectActions && !chat.blockedByUser ))) {
                  const shouldShowTimestampForDirect = !(chat.type === 'direct' && calculatedUnreadCount === 0 && !specialStatusText && !chat.blockedByUser && !showAcceptRejectActions && !showPendingClockIcon && !chat.isRejected);

                  if (chat.type === 'group' || (chat.type === 'direct' && shouldShowTimestampForDirect)) {
                     return (
                        <span className="text-xs text-sidebar-foreground/60 shrink-0">
                           {formatDistanceToNowStrict(new Date(statusTimestamp), { locale: idLocale, addSuffix: false })}
                        </span>
                     );
                  }
                }
                return null;
              })()}
            </div>
          </div>
          {statusMessageToDisplay && (
            <p className="text-xs text-sidebar-foreground/70 truncate overflow-hidden">
              {statusMessageToDisplay}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
