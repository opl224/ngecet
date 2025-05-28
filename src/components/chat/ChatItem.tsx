
"use client";

import type { Chat, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from 'date-fns';
import { Users, User as UserIcon, Check, X, Trash2, ShieldAlert, ShieldOff, Clock } from "lucide-react";

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
  let showDeleteAction = false;
  let specialStatusText: string | null = null;
  const calculatedUnreadCount = chat.calculatedUnreadCount || 0;
  let showPendingClockIcon = false;


  if (chat.type === "direct") {
    if (chat.blockedByUser === currentUser.id) {
        specialStatusText = `Anda memblokir ${name}.`;
        statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
    } else if (chat.blockedByUser && chat.blockedByUser !== currentUser.id) {
        specialStatusText = `${name} mungkin memblokir Anda.`;
         statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
    } else if (chat.pendingApprovalFromUserId === currentUser.id) {
      statusTimestamp = chat.requestTimestamp;
      showAcceptRejectActions = true;
    } else if (chat.pendingApprovalFromUserId) {
      showPendingClockIcon = true;
      statusTimestamp = chat.requestTimestamp;
    } else if (chat.isRejected) {
      if (chat.rejectedByUserId === currentUser.id) {
        // Do not set specialStatusText, delete button will be shown
        specialStatusText = null;
      } else {
        specialStatusText = `${name} menolak permintaan Anda.`;
      }
      statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
      showDeleteAction = true;
    }
  }


  const handleItemClick = () => {
    const canSelectChat = !(
      (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser.id && !isActive) ||
      (chat.isRejected && !isActive) ||
      (chat.blockedByUser && chat.blockedByUser !== currentUser.id && !isActive)
    );

    if (chat.pendingApprovalFromUserId === currentUser.id) {
        return;
    }

    if (canSelectChat) {
      onSelectChat(chat);
    }
  };

  const isItemActiveInList = isActive && !chat.pendingApprovalFromUserId && !chat.isRejected && !(chat.type === 'direct' && chat.blockedByUser);


  let statusMessage: React.ReactNode = null;
  if (specialStatusText) {
    statusMessage = specialStatusText;
  } else if (chat.type === "direct" && chat.pendingApprovalFromUserId === currentUser.id) {
    statusMessage = "Permintaan chat baru";
  } else if (showPendingClockIcon && !chat.isRejected) {
    // No status message needed if clock icon is shown for pending sent requests
  } else if (chat.type === "group" && !chat.lastMessage && !chat.pendingApprovalFromUserId && !chat.isRejected) {
     statusMessage = `${chat.participants.length} anggota`;
  } else if (chat.type === "direct" && !chat.lastMessage && !chat.pendingApprovalFromUserId && !chat.isRejected && !chat.blockedByUser) {
     statusMessage = "Mulai percakapan";
  }


  const isClickDisabled =
    (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser.id && !isActive) ||
    (chat.isRejected && !isActive) ||
    (chat.blockedByUser && chat.blockedByUser !== currentUser.id && !isActive) ||
    (chat.pendingApprovalFromUserId === currentUser.id);


  return (
    <div
      className={cn(
        "w-full text-left p-3 flex flex-col rounded-lg hover:bg-sidebar-accent transition-colors",
        isItemActiveInList ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
        isClickDisabled && "opacity-70 cursor-not-allowed"
      )}
    >
      <div
        onClick={!isClickDisabled ? handleItemClick : undefined}
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
                  chat.blockedByUser === currentUser.id && "text-destructive flex items-center"
                )}
              >
                {chat.blockedByUser === currentUser.id && <ShieldAlert className="h-4 w-4 mr-1.5 shrink-0" />}
                {name}
              </h4>
            </div>
            {(() => {
              if (showAcceptRejectActions && chat.type === "direct" && chat.pendingApprovalFromUserId === currentUser.id) {
                return (
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); onRejectChat(chat.id); }}
                      className="h-7 w-7 p-1 text-destructive hover:bg-destructive/5 hover:text-destructive"
                      aria-label="Tolak Permintaan"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); onAcceptChat(chat.id); }}
                      className="h-7 w-7 p-1 text-green-600 hover:bg-green-500/5 hover:text-green-700"
                      aria-label="Terima Permintaan"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                );
              }
              if (!specialStatusText && calculatedUnreadCount > 0) {
                return (
                  <Badge variant="default" className="h-5 px-1.5 text-xs shrink-0 ml-2">
                    {calculatedUnreadCount > 9 ? '9+' : calculatedUnreadCount}
                  </Badge>
                );
              }
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
              if (statusTimestamp && (!specialStatusText || (showPendingClockIcon && !chat.isRejected && chat.type === 'direct')) && calculatedUnreadCount === 0) {
                 if (chat.type === 'group' || (showPendingClockIcon && chat.type === 'direct' && !chat.isRejected) || (chat.type === 'direct' && !chat.isRejected && !chat.pendingApprovalFromUserId && !chat.blockedByUser) ) { // Added condition for active direct chats
                     return (
                        <span className="text-xs text-sidebar-foreground/60 shrink-0 ml-2">
                          {formatDistanceToNowStrict(new Date(statusTimestamp), { addSuffix: false })}
                        </span>
                      );
                 }
              }
              return null;
            })()}
          </div>
          {statusMessage && (
            <p className="text-xs text-sidebar-foreground/70 truncate overflow-hidden">
              {statusMessage}
            </p>
          )}
        </div>
      </div>
      {showDeleteAction && (
        <div className="mt-2 flex justify-end space-x-2">
            <Button
                size="sm"
                variant="destructive"
                className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
                onClick={(e) => { e.stopPropagation(); onDeleteChatPermanently(chat.id); }}
            >
                <Trash2 className="mr-1 h-4 w-4" /> Hapus Chat
            </Button>
        </div>
      )}
      {chat.type === "direct" && chat.blockedByUser === currentUser.id && (
        <div className="mt-2 flex justify-end space-x-2">
          {/* Tombol Buka Blokir ada di ChatView, bukan di sini */}
        </div>
      )}
    </div>
  );
}
