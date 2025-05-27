
"use client";

import React from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, User } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const ChatHeader = () => {
  const { activeChat, getUsersByIds } = useChat();

  if (!activeChat) {
    return <div className="h-16 border-b flex items-center px-4 bg-card"></div>; // Placeholder or specific styling
  }

  const participants = getUsersByIds(activeChat.participantIds);

  return (
    <div className="h-16 border-b flex items-center px-6 justify-between bg-card shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={activeChat.avatarUrl} alt={activeChat.name} data-ai-hint={activeChat.type === 'group' ? 'group logo' : 'avatar person'} />
          <AvatarFallback>
            {activeChat.type === 'group' ? <Users className="h-5 w-5" /> : activeChat.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg text-foreground">{activeChat.name}</h2>
          {activeChat.type === 'group' && (
             <p className="text-xs text-muted-foreground">{activeChat.participantIds.length} members</p>
          )}
        </div>
      </div>
      {activeChat.type === 'group' && participants.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Users className="h-5 w-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Group Members</h4>
              <ul className="space-y-1">
                {participants.map(p => (
                  <li key={p.id} className="text-sm flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={p.avatarUrl} alt={p.name} data-ai-hint="avatar person" />
                      <AvatarFallback>{p.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {p.name}
                  </li>
                ))}
              </ul>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default ChatHeader;
