
"use client";

import type { Chat, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict, format } from 'date-fns';
import { Users, User as UserIcon, Check, X, Send, AlertCircle } from "lucide-react";

interface ChatItemProps {
  chat: Chat;
  currentUser: User;
  onSelectChat: (chat: Chat) => void;
  isActive: boolean;
  onAcceptChat: (chatId: string) => void;
  onRejectChat: (chatId: string) => void;
}

export function ChatItem({ chat, currentUser, onSelectChat, isActive, onAcceptChat, onRejectChat }: ChatItemProps) {
  const getChatDisplayDetails = () => {
    if (chat.type === "direct") {
      const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
      const nameForDisplay = otherParticipant?.name || chat.name || "Unknown User"; // Fallback to chat.name
      const avatarForDisplay = otherParticipant?.avatarUrl || chat.avatarUrl;
      const initials = (nameForDisplay?.substring(0, 2) || "??").toUpperCase();
      return { name: nameForDisplay, avatarUrl: avatarForDisplay, initials, Icon: UserIcon };
    } else { // group
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

  // Determine chat status message and actions
  let statusMessage = chat.lastMessage;
  let statusTimestamp = chat.lastMessageTimestamp;
  let showActions = false;

  if (chat.type === "direct") {
    if (chat.pendingApprovalFromUserId === currentUser.id) {
      statusMessage = `${otherParticipant?.name || 'Someone'} ingin memulai chat.`;
      statusTimestamp = chat.requestTimestamp;
      showActions = true;
    } else if (chat.pendingApprovalFromUserId) { // Request sent by current user, waiting for other
      statusMessage = `Permintaan terkirim. Menunggu ${name}...`;
      statusTimestamp = chat.requestTimestamp;
    } else if (chat.isRejected) {
      if (chat.rejectedByUserId === currentUser.id) {
        statusMessage = `Anda menolak permintaan dari ${name}.`;
      } else {
        statusMessage = `${name} menolak permintaan Anda.`;
      }
      statusTimestamp = chat.lastMessageTimestamp; // Use rejection timestamp
    }
  }


  const handleItemClick = () => {
    if (chat.pendingApprovalFromUserId || chat.isRejected) {
      // Do nothing or show a toast, handled by page.tsx handleSelectChat
      onSelectChat(chat); // Let page.tsx handle the toast/logic
      return;
    }
    onSelectChat(chat);
  };

  const isClickable = !chat.pendingApprovalFromUserId && !chat.isRejected;


  return (
    <div
      className={cn(
        "w-full text-left p-3 flex flex-col rounded-lg hover:bg-sidebar-accent transition-colors",
        isActive && isClickable ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
        !isClickable && "opacity-70 cursor-not-allowed"
      )}
    >
      <button
        onClick={handleItemClick}
        disabled={!isClickable}
        className="w-full flex items-center space-x-3"
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt={name || 'Chat Avatar'} data-ai-hint={chat.type === 'group' ? 'group people' : 'person abstract'} />
          <AvatarFallback>
            {initials || <Icon className="h-5 w-5 text-sidebar-foreground/70" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h4 className={cn("font-semibold text-sm truncate", chat.pendingApprovalFromUserId === currentUser.id && "text-primary")}>{name}</h4>
            {statusTimestamp && (
              <p className="text-xs text-sidebar-foreground/60 whitespace-nowrap">
                {formatDistanceToNowStrict(new Date(statusTimestamp), { addSuffix: false })}
              </p>
            )}
          </div>
          <p className="text-xs text-sidebar-foreground/70 truncate">
            {statusMessage || (chat.type === "group" ? `${chat.participants.length} members` : "No messages yet")}
          </p>
        </div>
      </button>
      {showActions && chat.type === "direct" && chat.pendingApprovalFromUserId === currentUser.id && (
        <div className="mt-2 flex justify-end space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onRejectChat(chat.id); }}
            className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive-foreground"
          >
            <X className="mr-1 h-4 w-4" /> Tolak
          </Button>
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); onAcceptChat(chat.id); }}
            className="bg-primary hover:bg-primary/90"
          >
            <Check className="mr-1 h-4 w-4" /> Terima
          </Button>
        </div>
      )}
    </div>
  );
}
