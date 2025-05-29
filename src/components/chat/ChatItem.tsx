
"use client";

import type { Chat, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
import { Users, User as UserIcon, Check, X, Trash2, ShieldAlert, Clock } from "lucide-react";

interface ChatItemProps {
  chat: Chat & { calculatedUnreadCount?: number };
  currentUser: User;
  onSelectChat: (chat: Chat) => void;
  isActive: boolean;
  onAcceptChat: (chatId: string) => void;
  onRejectChat: (chatId: string) => void;
  onDeleteChatPermanently: (chatId: string) => void;
}

export function ChatItem({
  chat,
  currentUser,
  onSelectChat,
  isActive,
  onAcceptChat,
  onRejectChat,
  onDeleteChatPermanently,
}: ChatItemProps) {
  const getChatDisplayDetails = () => {
    if (chat.type === "direct") {
      const otherParticipant = chat.participants.find(p => typeof p === 'object' && p.id !== currentUser.id);
      const nameForDisplay = otherParticipant?.name || chat.name || "";
      const avatarForDisplay = otherParticipant?.avatarUrl || chat.avatarUrl;
      const initials = (nameForDisplay ? nameForDisplay.substring(0, 2) : "??").toUpperCase();
      return { name: nameForDisplay, avatarUrl: avatarForDisplay, initials, Icon: UserIcon, otherParticipantStatus: otherParticipant?.status };
    } else {
      const groupName = chat.name || "Unnamed Group";
      return {
        name: groupName,
        avatarUrl: chat.avatarUrl,
        initials: (groupName.substring(0, 2) || "GR").toUpperCase(),
        Icon: Users,
        otherParticipantStatus: null,
      };
    }
  };

  const { name, avatarUrl, initials, Icon, otherParticipantStatus } = getChatDisplayDetails();

  let statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
  let showAcceptRejectActions = false;
  let showDeleteActionForRejected = false;
  let specialStatusText: string | null = null;
  const calculatedUnreadCount = chat.calculatedUnreadCount || 0;
  let showPendingClockIcon = false;

  if (chat.type === "direct") {
    if (chat.blockedByUser === currentUser.id) {
        specialStatusText = null; // Overlay in ChatView handles this, ChatItem shows shield icon
        statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
    } else if (chat.blockedByUser && chat.blockedByUser !== currentUser.id) {
        specialStatusText = `${name} mungkin memblokir Anda.`;
        statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
    } else if (chat.pendingApprovalFromUserId === currentUser.id) {
      statusTimestamp = chat.requestTimestamp;
      showAcceptRejectActions = true;
      specialStatusText = "Permintaan chat baru"; // This text will be shown below the name
    } else if (chat.pendingApprovalFromUserId) {
      showPendingClockIcon = true;
      statusTimestamp = chat.requestTimestamp;
      // No specialStatusText here, clock icon implies pending
    } else if (chat.isRejected) {
      if (chat.rejectedByUserId === currentUser.id) {
        specialStatusText = null; // No text, just show delete icon
      } else {
        specialStatusText = `${name} menolak permintaan Anda.`;
      }
      statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
      showDeleteActionForRejected = true; // Show delete icon next to name
    }
  }

  // Determine if the item body should be clickable
  const isClickDisabled =
    (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser.id && !isActive) ||
    (chat.type === 'direct' && chat.blockedByUser && chat.blockedByUser !== currentUser.id && !isActive);
    // REMOVED: || (chat.pendingApprovalFromUserId === currentUser.id) to allow selection

  const handleItemClick = () => {
    // If this function is called, it means !isClickDisabled was true.
    // The onSelectChat function in page.tsx will handle toasts for different states.
    onSelectChat(chat);
  };

  const isItemActiveInList = isActive &&
    !chat.pendingApprovalFromUserId && // Don't show active style if it's a pending request for the current user
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
      onClick={!isClickDisabled ? handleItemClick : undefined}
      className={cn(
        "w-full text-left p-3 flex flex-col rounded-lg hover:bg-sidebar-accent transition-colors",
        isItemActiveInList ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
        isClickDisabled && !showAcceptRejectActions && "opacity-70 cursor-not-allowed" // This handles visual cue for non-actionable items
      )}
    >
      <div
        className={cn(
            "w-full flex items-center space-x-3",
            !isClickDisabled && "cursor-pointer"
        )}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt={name || 'Chat Avatar'} data-ai-hint={chat.type === 'group' ? 'group people' : 'person abstract'} />
          <AvatarFallback>
            {initials || <Icon className="h-5 w-5 text-sidebar-foreground/70" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {showPendingClockIcon && !chat.isRejected && (
                <Clock className="h-4 w-4 mr-1.5 text-sidebar-foreground/70 shrink-0" />
              )}
              <h4 className={cn(
                  "font-semibold text-sm truncate",
                  chat.pendingApprovalFromUserId === currentUser.id && "text-primary",
                  chat.isRejected && "text-destructive",
                  (chat.type === 'direct' && chat.blockedByUser === currentUser.id) && "text-destructive flex items-center"
                )}
              >
                {(chat.type === 'direct' && chat.blockedByUser === currentUser.id) && <ShieldAlert className="h-4 w-4 mr-1.5 shrink-0" />}
                {name}
              </h4>
            </div>
            {(() => {
              if (showAcceptRejectActions) { // For incoming pending requests
                return (
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
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
              if (showDeleteActionForRejected) { // For rejected chats (by anyone)
                 return (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onDeleteChatPermanently(chat.id); }}
                    className="h-7 w-7 p-1 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 ml-2"
                    aria-label="Hapus Chat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                );
              }
              if (!specialStatusText && calculatedUnreadCount > 0) {
                return (
                  <Badge variant="default" className="h-5 px-1.5 text-xs shrink-0 ml-2">
                    {calculatedUnreadCount > 9 ? '9+' : calculatedUnreadCount}
                  </Badge>
                );
              }
              if (statusTimestamp && !specialStatusText) {
                 if (chat.type === 'direct' && !chat.blockedByUser && !showAcceptRejectActions && !showPendingClockIcon && !chat.isRejected && calculatedUnreadCount === 0) {
                    const status = otherParticipantStatus || "Offline";
                    const isOnline = status === "Online";
                    return (
                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                        <span className={cn(
                          "h-2 w-2 rounded-full block",
                          isOnline ? "bg-green-500" : "bg-sidebar-foreground/30"
                        )}></span>
                        <span className="text-xs text-sidebar-foreground/70">{status}</span>
                      </div>
                    );
                 }
                 // For group chats, or pending sent requests, or active direct chats with no unread messages
                 if (chat.type === 'group' || (showPendingClockIcon && chat.type === 'direct' && !chat.isRejected) || (chat.type === 'direct' && !chat.isRejected && !chat.pendingApprovalFromUserId && !chat.blockedByUser && calculatedUnreadCount === 0)) {
                     return (
                        <span className="text-xs text-sidebar-foreground/60 shrink-0 ml-2">
                          {formatDistanceToNowStrict(new Date(statusTimestamp), { locale: idLocale })}
                        </span>
                      );
                 }
              }
              return null;
            })()}
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

