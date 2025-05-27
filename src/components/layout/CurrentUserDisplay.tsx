
"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const CurrentUserDisplay = () => {
  const { currentUser, setCurrentUser } = useAuth();

  if (!currentUser) return null;

  const handleLogout = () => {
    setCurrentUser(null); 
    // Potentially clear other localStorage items if needed
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('localchat_chats');
      window.localStorage.removeItem('localchat_messages');
      // Keep users list for faster re-join, or clear it too:
      // window.localStorage.removeItem('localchat_users');
    }
  };

  return (
    <div className="p-4 border-b border-sidebar-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="avatar person"/>
            <AvatarFallback>{currentUser.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sidebar-foreground">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-sidebar-foreground">
              <LogOut className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end">
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default CurrentUserDisplay;
