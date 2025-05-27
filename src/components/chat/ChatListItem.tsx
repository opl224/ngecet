
"use client";

import type { Chat, User } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { Users } from 'lucide-react';

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
  currentUser: User | null;
}

const ChatListItem = ({ chat, isActive, onClick, currentUser }: ChatListItemProps) => {
  const lastMessageText = chat.lastMessage?.text || (chat.type === 'group' ? 'Group created' : 'Chat started');
  const lastMessageTimestamp = chat.lastMessage?.timestamp;
  
  let displayName = chat.name;
  let displayAvatar = chat.avatarUrl;

  if (chat.type === 'direct' && currentUser) {
     // Name and avatar already set correctly in ChatContext for direct chats
  }


  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full p-3 hover:bg-sidebar-accent rounded-lg transition-colors duration-150",
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Avatar className="h-10 w-10 mr-3">
        <AvatarImage src={displayAvatar} alt={displayName} data-ai-hint={chat.type === 'group' ? 'group logo' : 'avatar person'} />
        <AvatarFallback>
          {chat.type === 'group' ? <Users className="h-5 w-5" /> : displayName?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex justify-between items-center">
          <p className="font-semibold truncate text-sm">{displayName}</p>
          {lastMessageTimestamp && (
            <p className={cn("text-xs", isActive ? "text-sidebar-accent-foreground/80" : "text-muted-foreground")}>
              {formatDistanceToNowStrict(new Date(lastMessageTimestamp), { addSuffix: false })}
            </p>
          )}
        </div>
        <p className={cn("text-xs truncate", isActive ? "text-sidebar-accent-foreground/70" : "text-muted-foreground")}>
          {chat.lastMessage?.senderId === currentUser?.id ? "You: " : ""}{lastMessageText}
        </p>
      </div>
    </button>
  );
};

export default ChatListItem;
