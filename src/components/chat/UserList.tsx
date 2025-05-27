
"use client";

import React from 'react';
import { useChat } from '@/contexts/ChatContext';
import UserListItem from './UserListItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const UserList = () => {
  const { users, createDirectChat } = useChat();

  const handleStartChat = async (userId: string) => {
    await createDirectChat(userId);
  };
  
  return (
    <div className="flex flex-col">
      <h3 className="p-4 text-sm font-semibold text-sidebar-foreground">Start New Chat</h3>
      <Separator className="mx-2 bg-sidebar-border" />
      <ScrollArea className="h-[200px] flex-shrink-0"> {/* Adjust height as needed */}
        <div className="p-2 space-y-1">
          {users.map((user) => (
            <UserListItem key={user.id} user={user} onStartChat={handleStartChat} />
          ))}
          {users.length === 0 && (
             <p className="p-4 text-center text-xs text-muted-foreground">No other users available.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UserList;
