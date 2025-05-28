
"use client";

import type { Chat, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from 'date-fns';
import { Users, User as UserIcon, Check, X, Trash2, ShieldAlert, ShieldOff, Clock } from "lucide-react"; // Added Clock

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
  const otherParticipantNameDisplay = (chat.type === 'direct' && chat.participants.find(p => typeof p === 'object' && p.id !== currentUser.id)?.name) || name || "Seseorang";

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
    } else if (chat.pendingApprovalFromUserId === currentUser.id) {
      specialStatusText = `${otherParticipantNameDisplay} ingin memulai chat.`;
      statusTimestamp = chat.requestTimestamp;
      showAcceptRejectActions = true;
    } else if (chat.pendingApprovalFromUserId) {
      // specialStatusText = `Permintaan dikirim. Menunggu ${name}...`; // Removed this line
      showPendingClockIcon = true; // Show clock icon instead
      statusTimestamp = chat.requestTimestamp;
    } else if (chat.isRejected) {
      if (chat.rejectedByUserId === currentUser.id) {
        specialStatusText = `Anda menolak permintaan dari ${name}.`;
      } else {
        specialStatusText = `${name} menolak permintaan anda.`;
      }
      statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
      showDeleteAction = true;
    }
  }


  const handleItemClick = () => {
    onSelectChat(chat);
  };

  const isItemActiveInList = isActive && !chat.pendingApprovalFromUserId && !chat.isRejected && !chat.blockedByUser;

  let statusMessage: React.ReactNode = null;
  if (specialStatusText) {
    statusMessage = specialStatusText;
  } else if (showPendingClockIcon && !chat.isRejected) {
    // No status message needed if clock icon is shown for pending sent requests
  } else if (chat.type === "group" && !chat.lastMessage && !chat.pendingApprovalFromUserId && !chat.isRejected) {
     statusMessage = `${chat.participants.length} anggota`;
  } else if (chat.type === "direct" && !chat.lastMessage && !chat.pendingApprovalFromUserId && !chat.isRejected && !chat.blockedByUser) {
     statusMessage = "Mulai percakapan";
  }


  return (
    <div
      className={cn(
        "w-full text-left p-3 flex flex-col rounded-lg hover:bg-sidebar-accent transition-colors",
        isItemActiveInList ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
        ( (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser.id && !isActive) ||
          (chat.isRejected && !isActive) ||
          (chat.blockedByUser && chat.blockedByUser !== currentUser.id && !isActive)
        ) && "opacity-70"
      )}
    >
      <button
        onClick={handleItemClick}
        disabled={
           (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser.id && !isActive) ||
           (chat.isRejected && !isActive) ||
           (chat.blockedByUser && chat.blockedByUser !== currentUser.id && !isActive)
        }
        className="w-full flex items-center space-x-3"
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
              if (!specialStatusText && calculatedUnreadCount > 0) {
                return (
                  <Badge variant="default" className="h-5 px-1.5 text-xs shrink-0 ml-2">
                    {calculatedUnreadCount > 9 ? '9+' : calculatedUnreadCount}
                  </Badge>
                );
              }
              if (!specialStatusText && !showPendingClockIcon && statusTimestamp && chat.type === 'direct' && !chat.blockedByUser) {
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
              if (statusTimestamp && (!specialStatusText || (showPendingClockIcon && !chat.isRejected && chat.type === 'direct'))) {
                if (!specialStatusText && !showPendingClockIcon && chat.type === 'group') {
                     return (
                        <span className="text-xs text-sidebar-foreground/60 shrink-0 ml-2">
                          {formatDistanceToNowStrict(new Date(statusTimestamp), { addSuffix: false })}
                        </span>
                      );
                } else if (showPendingClockIcon && chat.type === 'direct' && !chat.isRejected) {
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
      </button>
      {showAcceptRejectActions && chat.type === "direct" && chat.pendingApprovalFromUserId === currentUser.id && (
        <div className="mt-2 flex justify-end space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onRejectChat(chat.id); }}
            className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive-foreground focus:border-destructive focus:bg-destructive/10"
          >
            <X className="mr-1 h-4 w-4" /> Tolak
          </Button>
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); onAcceptChat(chat.id); }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Check className="mr-1 h-4 w-4" /> Terima
          </Button>
        </div>
      )}
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
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onUnblockUser(chat.id); }}
            className="text-green-600 border-green-500 hover:bg-green-500/10 hover:text-green-700 focus:border-green-600 focus:bg-green-500/10"
          >
            <ShieldOff className="mr-1 h-4 w-4" /> Buka Blokir
          </Button>
        </div>
      )}
    </div>
  );
}
