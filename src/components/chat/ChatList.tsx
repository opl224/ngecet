
"use client";

import type { Chat, User } from "@/types";
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
  onSelectChat: (chat: Chat) => void;
  selectedChatId?: string | null;
  onNewDirectChat: () => void;
  onNewGroupChat: () => void;
}

export function ChatList({
  chats,
  currentUser,
  onSelectChat,
  selectedChatId,
  onNewDirectChat,
  onNewGroupChat,
}: ChatListProps) {
  if (!currentUser) {
    return <div className="p-4 text-sm text-sidebar-foreground/70">Loading user...</div>;
  }

  const sortedChats = [...chats].sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));

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
          {sortedChats.length > 0 ? (
            sortedChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                currentUser={currentUser}
                onSelectChat={onSelectChat}
                isActive={selectedChatId === chat.id}
              />
            ))
          ) : (
            <div className="p-4 text-center text-sm text-sidebar-foreground/70">
              No chats yet. Start a new conversation!
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
