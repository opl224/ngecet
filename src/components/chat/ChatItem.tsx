
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
    const otherParticipantName = (typeof otherParticipant === 'object' ? otherParticipant?.name : null) || name || "Someone";
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
      statusTimestamp = chat.lastMessageTimestamp; // Keep timestamp for sorting/display
      showDeleteAction = true;
    }
  }


  const handleItemClick = () => {
    onSelectChat(chat);
  };

  const isItemActiveInList = isActive && !chat.pendingApprovalFromUserId && !chat.isRejected;

  const unreadCount = chat.unreadCount || 0;


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
        <div className="flex-1 min-w-0 overflow-hidden"> {/* Added overflow-hidden here */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 min-w-0">
                <h4 className={cn(
                    "font-semibold text-sm truncate",
                    chat.pendingApprovalFromUserId === currentUser.id && "text-primary",
                    chat.isRejected && "text-destructive"
                  )}
                >
                  {name}
                </h4>
                {unreadCount > 0 && !specialStatusText && (
                  <Badge variant="default" className="h-5 px-1.5 text-xs shrink-0">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
            </div>
            {statusTimestamp && (
              <p className="text-xs text-sidebar-foreground/60 whitespace-nowrap ml-2 shrink-0">
                {formatDistanceToNowStrict(new Date(statusTimestamp), { addSuffix: false })}
              </p>
            )}
          </div>
          {/* Display special status text or placeholder messages */}
          {specialStatusText ? (
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {specialStatusText}
            </p>
          ) : chat.type === "group" && !chat.lastMessage && !chat.pendingApprovalFromUserId && !chat.isRejected ? (
             <p className="text-xs text-sidebar-foreground/70 truncate">
                {`${chat.participants.length} anggota`}
              </p>
           ) : chat.type === "direct" && !chat.lastMessage && !chat.pendingApprovalFromUserId && !chat.isRejected ? (
             <p className="text-xs text-sidebar-foreground/70 truncate">
                Mulai percakapan
              </p>
           ) : !chat.lastMessage && !specialStatusText ? ( // If no last message and no special text, show a generic placeholder
            <p className="text-xs text-sidebar-foreground/70 truncate">
              Belum ada pesan
            </p>
           ) : (
            // Fallback if lastMessage exists but shouldn't be displayed or for other cases
            // We want to avoid displaying the last message content here.
            // If specialStatusText is null and there IS a lastMessage, we still don't show it.
            // The timestamp and unread badge handle the "activity" indication.
            // If there's no specialStatusText AND no messages at all, the "Mulai percakapan" or "X anggota" handles it.
            // This effectively hides the last message text.
            // We can show a generic hint if needed, or just rely on timestamp/unread.
            // For now, let's ensure nothing is shown if it's not a special status or placeholder.
            // If chat.lastMessage exists BUT specialStatusText is null, this block is skipped,
            // which is what we want to hide the last message text.
            // The conditions above handle the empty/placeholder states.
            // An explicit empty placeholder if all else fails and we just want to hide last message content
            chat.lastMessage && !specialStatusText && (
                <p className="text-xs text-sidebar-foreground/70 truncate italic">
                    {chat.type === 'group' ? 'Aktivitas grup terakhir' : 'Aktivitas terakhir'}
                </p>
            )
           )
          }
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
