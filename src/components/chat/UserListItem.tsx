
"use client";

import type { User } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';

interface UserListItemProps {
  user: User;
  onStartChat: (userId: string) => void;
}

const UserListItem = ({ user, onStartChat }: UserListItemProps) => {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-sidebar-accent rounded-lg transition-colors duration-150">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar person" />
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sidebar-foreground text-sm">{user.name}</p>
          {/* Online status could be added here if implemented */}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onStartChat(user.id)} className="text-primary hover:text-primary/80">
        <MessageSquarePlus className="h-5 w-5" />
        <span className="sr-only">Start chat with {user.name}</span>
      </Button>
    </div>
  );
};

export default UserListItem;
