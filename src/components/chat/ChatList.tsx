
"use client";

import type { Chat, User, Message } from "@/types";
import { ChatItem } from "./ChatItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, MessageSquarePlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatListProps {
  chats: Chat[];
  currentUser: User | null;
  allMessages: Record<string, Message[]>; // Added to calculate unread counts
  onSelectChat: (chat: Chat) => void;
  selectedChatId?: string | null;
  onNewDirectChat: () => void;
  onNewGroupChat: () => void;
  onAcceptChat: (chatId: string) => void;
  onRejectChat: (chatId: string) => void;
  onDeleteChatPermanently: (chatId: string) => void;
}

export function ChatList({
  chats,
  currentUser,
  allMessages,
  onSelectChat,
  selectedChatId,
  onNewDirectChat,
  onNewGroupChat,
  onAcceptChat,
  onRejectChat,
  onDeleteChatPermanently,
}: ChatListProps) {
  if (!currentUser) {
    return <div className="p-4 text-sm text-sidebar-foreground/70">Loading user...</div>;
  }

  const sortedChatsWithUnread = [...chats]
    .map(chat => {
      if (!currentUser) return { ...chat, calculatedUnreadCount: 0 };
      
      const lastReadTimestamp = chat.lastReadBy?.[currentUser.id] || 0;
      const messagesInChat = allMessages[chat.id] || [];
      
      const unreadMessagesCount = messagesInChat.filter(
        msg => msg.senderId !== currentUser.id && msg.timestamp > lastReadTimestamp
      ).length;
      
      return { ...chat, calculatedUnreadCount: unreadMessagesCount };
    })
    .sort((a, b) => {
      const tsA = a.lastMessageTimestamp || a.requestTimestamp || 0;
      const tsB = b.lastMessageTimestamp || b.requestTimestamp || 0;
      return tsB - tsA;
    });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border flex justify-between items-center">
        <h3 className="text-lg font-semibold text-sidebar-foreground">Chats</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">New Chat</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onNewDirectChat}>
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              New Direct Message
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewGroupChat}>
              <Users className="mr-2 h-4 w-4" />
              New Group Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedChatsWithUnread.length > 0 ? (
            sortedChatsWithUnread.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat} // This chat object now includes calculatedUnreadCount
                currentUser={currentUser}
                onSelectChat={onSelectChat}
                isActive={selectedChatId === chat.id && !chat.pendingApprovalFromUserId && !chat.isRejected}
                onAcceptChat={onAcceptChat}
                onRejectChat={onRejectChat}
                onDeleteChatPermanently={onDeleteChatPermanently}
              />
            ))
          ) : (
            <div className="p-4 text-center text-sm text-sidebar-foreground/70">
              No chats yet. Start a new conversation or wait for requests!
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
