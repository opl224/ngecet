"use client";

import React from 'react';
import { useChat } from '@/contexts/ChatContext';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Loader2 } from 'lucide-react';

const ChatWindow = () => {
  const { activeChat, isLoading } = useChat();

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!activeChat) {
     return (
      <div className="h-full flex flex-col items-center justify-center bg-background"> {/* MODIFIED: Centering container */}
        <div className="text-center p-8">
          <svg className="mx-auto h-24 w-24 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-ai-hint="chat bubbles">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h2 className="mt-6 text-xl font-semibold text-foreground">Select a chat</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a conversation from the sidebar or start a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChatHeader />
      <MessageList />
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
