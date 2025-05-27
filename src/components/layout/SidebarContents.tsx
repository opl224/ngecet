
"use client";

import React from 'react';
import CurrentUserDisplay from './CurrentUserDisplay';
import ChatList from '@/components/chat/ChatList';
import UserList from '@/components/chat/UserList';
import NewGroupChatModal from '@/components/chat/NewGroupChatModal';
import { Separator } from '@/components/ui/separator';
import { SidebarContent, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar'; // Assuming these are part of shadcn/ui or custom

const SidebarContents = () => {
  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <CurrentUserDisplay />
      
      <div className="p-2">
        <NewGroupChatModal />
      </div>
      
      <Separator className="mx-2 my-1 bg-sidebar-border" />
      
      <h3 className="p-4 pt-2 pb-1 text-sm font-semibold text-sidebar-foreground/80">Active Chats</h3>
      <ChatList />
      
      <Separator className="mx-2 my-1 bg-sidebar-border" />
      
      {/* UserList is for starting new DMs, could be in a collapsible section or its own tab if sidebar gets crowded */}
      <UserList /> 
    </div>
  );
};

export default SidebarContents;
