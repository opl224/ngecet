
"use client";

import type { Chat, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from 'date-fns';
import { Users, User as UserIcon } from "lucide-react";

interface ChatItemProps {
  chat: Chat;
  currentUser: User;
  onSelectChat: (chat: Chat) => void;
  isActive: boolean;
}

export function ChatItem({ chat, currentUser, onSelectChat, isActive }: ChatItemProps) {
  const getChatDisplayDetails = () => {
    if (chat.type === "direct") {
      const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
      const nameForDisplay = otherParticipant?.name || "Unknown User";
      const avatarForDisplay = otherParticipant?.avatarUrl || chat.avatarUrl; // Fallback to chat.avatarUrl if participant specific one is not there
      return {
        name: nameForDisplay,
        avatarUrl: avatarForDisplay,
        initials: (nameForDisplay.substring(0, 2) || "??").toUpperCase(),
        Icon: UserIcon,
      };
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

  return (
    <button
      onClick={() => onSelectChat(chat)}
      className={cn(
        "w-full text-left p-3 flex items-center space-x-3 rounded-lg hover:bg-sidebar-accent transition-colors",
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl} alt={name || 'Chat Avatar'} data-ai-hint={chat.type === 'group' ? 'group people' : 'person abstract'} />
        <AvatarFallback>
          {initials || <Icon className="h-5 w-5 text-sidebar-foreground/70" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-sm truncate">{name}</h4>
          {chat.lastMessageTimestamp && (
            <p className="text-xs text-sidebar-foreground/60 whitespace-nowrap">
              {formatDistanceToNowStrict(new Date(chat.lastMessageTimestamp), { addSuffix: false })}
            </p>
          )}
        </div>
        <p className="text-xs text-sidebar-foreground/70 truncate">
          {chat.lastMessage || (chat.type === "group" ? `${chat.participants.length} members` : "No messages yet")}
        </p>
      </div>
    </button>
  );
}

    