
"use client";

import type { Chat, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from 'date-fns';
import { Users, User as UserIcon, Check, X, Trash2 } from "lucide-react";

interface ChatItemProps {
  chat: Chat;
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
  onDeleteChatPermanently
}: ChatItemProps) {
  const getChatDisplayDetails = () => {
    if (chat.type === "direct") {
      const otherParticipant = chat.participants.find(p => typeof p === 'object' && p.id !== currentUser.id);
      const nameForDisplay = otherParticipant?.name || chat.name || "";
      const avatarForDisplay = otherParticipant?.avatarUrl || chat.avatarUrl;
      const initials = (nameForDisplay ? nameForDisplay.substring(0, 2) : "??").toUpperCase();
      return { name: nameForDisplay, avatarUrl: avatarForDisplay, initials, Icon: UserIcon };
    } else {
      const groupName = chat.name || "Unnamed Group";
      return {
        name: groupName,
        avatarUrl: chat.avatarUrl,
        initials: (groupName.substring(0, 2) || "GR").toUpperCase(),
        Icon: Users,
      };
    }
  };

  const { name, avatarUrl, initials, Icon } = getChatDisplayDetails();
  const otherParticipant = chat.type === 'direct' ? chat.participants.find(p => p.id !== currentUser.id) : null;

  let statusTimestamp = chat.lastMessageTimestamp;
  let showAcceptRejectActions = false;
  let showDeleteAction = false;
  let specialStatusText: string | null = null;


  if (chat.type === "direct") {
    const otherParticipantName = (typeof otherParticipant === 'object' ? otherParticipant?.name : null) || name || "Seseorang";
    if (chat.pendingApprovalFromUserId === currentUser.id) {
      specialStatusText = `${otherParticipantName} ingin memulai chat.`;
      statusTimestamp = chat.requestTimestamp;
      showAcceptRejectActions = true;
    } else if (chat.pendingApprovalFromUserId) {
      specialStatusText = `Permintaan dikirim. Menunggu ${name}...`;
      statusTimestamp = chat.requestTimestamp;
    } else if (chat.isRejected) {
      if (chat.rejectedByUserId === currentUser.id) {
        specialStatusText = `Anda menolak permintaan dari ${name}.`;
      } else {
        specialStatusText = `${name} menolak permintaan Anda.`;
      }
      statusTimestamp = chat.lastMessageTimestamp; // Could be requestTimestamp if lastMessageTimestamp is not set after rejection
      showDeleteAction = true;
    }
  }


  const handleItemClick = () => {
    onSelectChat(chat);
  };

  const isItemActiveInList = isActive && !chat.pendingApprovalFromUserId && !chat.isRejected;
  const unreadCount = chat.unreadCount || 0;

  let statusMessage: React.ReactNode = null;
  if (specialStatusText) {
    statusMessage = specialStatusText;
  } else if (chat.type === "group" && !chat.lastMessage && !chat.pendingApprovalFromUserId && !chat.isRejected) {
     statusMessage = `${chat.participants.length} anggota`;
  } else if (chat.type === "direct" && !chat.lastMessage && !chat.pendingApprovalFromUserId && !chat.isRejected) {
     statusMessage = "Mulai percakapan";
  } else if (!chat.lastMessage && !specialStatusText) { // If no last message and no special text
    statusMessage = "Belum ada pesan";
  }
  // The generic "Aktivitas terakhir" or "Aktivitas grup terakhir" is removed.
  // If there is a lastMessage but no specialStatusText, statusMessage will remain null.

  return (
    <div
      className={cn(
        "w-full text-left p-3 flex flex-col rounded-lg hover:bg-sidebar-accent transition-colors",
        isItemActiveInList ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
        ( (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser.id) ||
          (chat.isRejected && !isActive)
        ) && "opacity-70"
      )}
    >
      <button
        onClick={handleItemClick}
        disabled={
           (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser.id && !isActive) ||
           (chat.isRejected && !isActive)
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
            <h4 className={cn(
                "font-semibold text-sm truncate",
                chat.pendingApprovalFromUserId === currentUser.id && "text-primary",
                chat.isRejected && "text-destructive"
              )}
            >
              {name}
            </h4>
            {/* Display unread badge (if >0) or '0' badge (if 0 and active), but not if specialStatusText is present */}
            {!specialStatusText ? (
              unreadCount > 0 ? (
                <Badge variant="default" className="h-5 px-1.5 text-xs shrink-0 ml-2">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              ) : statusTimestamp ? ( // If unreadCount is 0 or undefined, but there was activity
                <Badge variant="outline" className="h-5 px-1.5 text-xs shrink-0 ml-2 text-sidebar-foreground/70 border-sidebar-foreground/30 bg-transparent">
                  {unreadCount || 0}
                </Badge>
              ) : null // No special text, no positive unread, no timestamp (e.g. truly empty new chat)
            ) : null /* specialStatusText exists, so it's handled in statusMessage below */}
          </div>
          {/* Display status message (previously last message or special status) */}
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
    </div>
  );
}

    