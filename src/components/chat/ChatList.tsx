
"use client";

import type { Chat, User, Message } from "@/types";
import { useState } from "react"; // Added useState
import { ChatItem } from "./ChatItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquarePlus, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatListProps {
  chats: Chat[];
  currentUser: User | null;
  allMessages: Record<string, Message[]>;
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
  const [activeFilter, setActiveFilter] = useState<'direct' | 'group' | null>(null);

  if (!currentUser) {
    return <div className="p-4 text-sm text-sidebar-foreground/70">Loading user...</div>;
  }

  const visibleChats = chats.filter(chat =>
    chat.participants.some(participant => typeof participant === 'object' && participant.id === currentUser.id)
  );

  const sortedChatsWithUnread = [...visibleChats]
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
      const tsB = b.lastMessageTimestamp || b.requestTimestamp || 0; // Corrected: b.requestTimestamp
      return tsB - tsA;
    });

  const handleFilterClick = (filter: 'direct' | 'group') => {
    setActiveFilter(prevFilter => prevFilter === filter ? null : filter);
  };

  const filteredChats = sortedChatsWithUnread.filter(chat => {
    if (!activeFilter) return true; // Show all if no filter is active
    return chat.type === activeFilter;
  });

  const getEmptyStateMessage = () => {
    if (!currentUser) return "Loading user..."; // Should not happen if currentUser check above is effective
    if (activeFilter === 'direct') return "Belum ada pesan!";
    if (activeFilter === 'group') return "Belum ada grup!";
    if (visibleChats.length === 0) return "Tambah pesan untuk saling berinteraksi";
    return "No chats match the current filter."; // Fallback if filters applied to an existing list yield no results
  };


  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 border-b border-sidebar-border flex items-center space-x-2">
        {/* Replaced H3 with filter buttons */}
        <Button
          variant={activeFilter === 'direct' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterClick('direct')}
          className="flex-1 h-9" // Added h-9 for consistent height
        >
          Pesan
        </Button>
        <Button
          variant={activeFilter === 'group' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleFilterClick('group')}
          className="flex-1 h-9" // Added h-9 for consistent height
        >
          Grup
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                currentUser={currentUser!} // currentUser is checked above
                onSelectChat={onSelectChat}
                isActive={selectedChatId === chat.id && !chat.pendingApprovalFromUserId && !chat.isRejected}
                onAcceptChat={onAcceptChat}
                onRejectChat={onRejectChat}
                onDeleteChatPermanently={onDeleteChatPermanently}
              />
            ))
          ) : (
            <div className="p-4 text-center text-sm text-sidebar-foreground/70">
              {getEmptyStateMessage()}
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="absolute bottom-6 right-6 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="rounded-full h-12 w-12 shadow-lg"
              aria-label="New Chat"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="mb-2 w-56">
            <DropdownMenuItem onClick={onNewDirectChat}>
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              Buat Pesan Baru
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewGroupChat}>
              <Users className="mr-2 h-4 w-4" />
              Buat Grup Baru
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
