
"use client";

import React, { useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import MessageBubble from './MessageBubble';
import { ScrollArea } from '@/components/ui/scroll-area';

const MessageList = () => {
  const { activeChatMessages, getUserById } = useChat();
  const { currentUser } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [activeChatMessages]);

  if (!currentUser) return null;

  return (
    <ScrollArea className="flex-grow" ref={scrollAreaRef} viewportRef={viewportRef}>
      <div className="space-y-4 py-4 md:py-6"> {/* Horizontal padding (px) removed */}
        {activeChatMessages.map((msg) => {
          const sender = getUserById(msg.senderId);
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              sender={sender}
              isCurrentUser={msg.senderId === currentUser.id}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default MessageList;
