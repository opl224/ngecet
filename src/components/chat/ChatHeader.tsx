
"use client";

import React, { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import type { User as UserType } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import UserProfileModal from '@/components/profile/UserProfileModal'; // Import baru

const ChatHeader = () => {
  const { activeChat, getUsersByIds, getUserById } = useChat();
  const { currentUser } = useAuth();
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserType | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  if (!activeChat) {
    return <div className="h-16 border-b flex items-center px-4 bg-card"></div>;
  }

  const participants = getUsersByIds(activeChat.participantIds);

  const handleOpenProfile = (user: UserType | undefined) => {
    if (user) {
      setSelectedProfileUser(user);
      setIsProfileModalOpen(true);
    }
  };

  let otherUserInDirectChat: UserType | undefined = undefined;
  if (activeChat.type === 'direct' && currentUser) {
    const otherUserId = activeChat.participantIds.find(id => id !== currentUser.id);
    if (otherUserId) {
      otherUserInDirectChat = getUserById(otherUserId);
    }
  }

  return (
    <>
      <div className="h-16 border-b flex items-center px-6 justify-between bg-card shadow-sm">
        <button
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1 -ml-1"
          onClick={() => activeChat.type === 'direct' ? handleOpenProfile(otherUserInDirectChat) : undefined}
          disabled={activeChat.type === 'group'} // Group avatar itself isn't a profile
          aria-label={activeChat.type === 'direct' && otherUserInDirectChat ? `View profile of ${otherUserInDirectChat.name}` : activeChat.name}
        >
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
        </button>
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
                    <li key={p.id}>
                      <button
                        onClick={() => handleOpenProfile(p)}
                        className="text-sm flex items-center gap-2 w-full hover:bg-muted/50 p-1 rounded-md text-left"
                        aria-label={`View profile of ${p.name}`}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={p.avatarUrl} alt={p.name} data-ai-hint="avatar person" />
                          <AvatarFallback>{p.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {p.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <UserProfileModal
        user={selectedProfileUser}
        isOpen={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
    </>
  );
};

export default ChatHeader;
