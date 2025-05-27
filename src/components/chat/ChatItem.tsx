
"use client";

import type { Chat, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
      // For direct chats, chat.name should ideally hold the other participant's name (set during creation).
      // Fallback chain: 1. otherParticipant object's name, 2. chat.name, 3. empty string.
      const nameForDisplay = otherParticipant?.name || chat.name || "";
      const avatarForDisplay = otherParticipant?.avatarUrl || chat.avatarUrl;
      // Ensure initials are "???" if nameForDisplay is empty.
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

  let statusMessage = chat.lastMessage;
  let statusTimestamp = chat.lastMessageTimestamp;
  let showAcceptRejectActions = false;
  let showDeleteAction = false;

  if (chat.type === "direct") {
    const otherParticipantName = (typeof otherParticipant === 'object' ? otherParticipant?.name : null) || name || "Someone"; // Use derived name
    if (chat.pendingApprovalFromUserId === currentUser.id) {
      statusMessage = `${otherParticipantName} ingin memulai chat.`;
      statusTimestamp = chat.requestTimestamp;
      showAcceptRejectActions = true;
    } else if (chat.pendingApprovalFromUserId) {
      statusMessage = `Permintaan terkirim. Menunggu ${name}...`;
      statusTimestamp = chat.requestTimestamp;
    } else if (chat.isRejected) {
      if (chat.rejectedByUserId === currentUser.id) {
        statusMessage = `Anda menolak permintaan dari ${name}.`;
      } else {
        statusMessage = `${name} menolak permintaan Anda.`;
      }
      statusTimestamp = chat.lastMessageTimestamp;
      showDeleteAction = true;
    }
  }


  const handleItemClick = () => {
    // Always allow selecting the chat item to show appropriate messages/actions in ChatView
    onSelectChat(chat);
  };

  // An item is considered "active" in the list if it's selected AND it's an active chat (not pending/rejected)
  const isItemActiveInList = isActive && !chat.pendingApprovalFromUserId && !chat.isRejected;


  return (
    <div
      className={cn(
        "w-full text-left p-3 flex flex-col rounded-lg hover:bg-sidebar-accent transition-colors",
        isItemActiveInList ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
        // Apply opacity if it's not pending for current user and not rejected (i.e. pending for other, or a normal chat that isn't active)
        // Or if it's a rejected chat that is not currently selected (isActive is false)
        ( (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser.id) ||
          (chat.isRejected && !isActive)
        ) && "opacity-70"
      )}
    >
      <button
        onClick={handleItemClick}
        // Disable button if it's pending for other user to accept and not active
        // Or if it's rejected and not active
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
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h4 className={cn(
                "font-semibold text-sm truncate",
                chat.pendingApprovalFromUserId === currentUser.id && "text-primary",
                chat.isRejected && "text-destructive"
              )}
            >
              {name}
            </h4>
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
      {showAcceptRejectActions && chat.type === "direct" && chat.pendingApprovalFromUserId === currentUser.id && (
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
                className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => { e.stopPropagation(); onDeleteChatPermanently(chat.id); }}
            >
                <Trash2 className="mr-1 h-4 w-4" /> Hapus Chat
            </Button>
        </div>
      )}
    </div>
  );
}
