
"use client";

import React from 'react';
import { useChat } from '@/contexts/ChatContext';
import ChatListItem from './ChatListItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';

const ChatList = () => {
  const { chats, activeChatId, setActiveChatId } = useChat();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {chats.length === 0 && (
          <p className="p-4 text-center text-sm text-muted-foreground">No chats yet. Start a new conversation!</p>
        )}
        {chats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === activeChatId}
            onClick={() => setActiveChatId(chat.id)}
            currentUser={currentUser}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default ChatList;
