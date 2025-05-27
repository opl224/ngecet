
"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserSetupForm from '@/components/auth/UserSetupForm';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarContents from './SidebarContents';
import ChatWindow from '@/components/chat/ChatWindow';
import { useChat } from '@/contexts/ChatContext';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { isLoading: chatLoading, activeChatId } = useChat(); // Ensure useChat is called if needed

  if (authLoading || chatLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return <UserSetupForm />;
  }
  
  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen bg-background">
        <Sidebar side="left" className="border-r" collapsible="icon">
          <SidebarContents />
        </Sidebar>
        <SidebarInset className="flex flex-col">
          {activeChatId ? <ChatWindow /> : (
            <div className="flex-grow flex items-center justify-center">
              <div className="text-center p-8">
                <svg className="mx-auto h-24 w-24 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" data-ai-hint="chat bubble illustration">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h2 className="mt-6 text-xl font-semibold text-foreground">Welcome to LocalChat</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select a chat to start messaging or create a new one.
                </p>
              </div>
            </div>
          )}
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

export default AppLayout;
