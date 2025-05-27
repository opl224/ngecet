
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { User, Chat, Message } from "@/types";
import useLocalStorage from "@/hooks/use-local-storage";
import { AppLogo } from "@/components/core/AppLogo";
import { UserProfileForm } from "@/components/core/UserProfileForm";
import { ChatList } from "@/components/chat/ChatList";
import { ChatView } from "@/components/chat/ChatView";
import { WelcomeMessage } from "@/components/chat/WelcomeMessage";
import { NewDirectChatDialog } from "@/components/chat/NewDirectChatDialog";
import { NewGroupChatDialog } from "@/components/chat/NewGroupChatDialog";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const LS_USER_KEY = "simplicchat_user";
const LS_CHATS_KEY = "simplicchat_chats";
const LS_MESSAGES_PREFIX = "simplicchat_messages_";

export default function ChatPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>(LS_USER_KEY, null);

  const initialChatsValue = useMemo(() => [], []);
  const [chats, setChats] = useLocalStorage<Chat[]>(LS_CHATS_KEY, initialChatsValue);

  const initialAllMessagesValue = useMemo(() => ({}), []);
  const [allMessages, setAllMessages] = useLocalStorage<Record<string, Message[]>>(`${LS_MESSAGES_PREFIX}all`, initialAllMessagesValue);

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isNewDirectChatDialogOpen, setIsNewDirectChatDialogOpen] = useState(false);
  const [isNewGroupChatDialogOpen, setIsNewGroupChatDialogOpen] = useState(false);
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    // Attempt to auto-select the most recent chat on initial load if chats exist
    if (chats.length > 0 && !selectedChat) {
        const sortedChats = [...chats].sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
        // setSelectedChat(sortedChats[0]); // This might cause issues if component isn't fully ready. Defer.
    }
  }, []);


  const handleSaveProfile = useCallback((name: string) => {
    const userId = name.toLowerCase().replace(/\s+/g, "_") || `user_${Date.now()}`;
    const profile: User = { id: userId, name, avatarUrl: `https://placehold.co/100x100.png?text=${name.substring(0,1)}` };
    setCurrentUser(profile);
    toast({ title: "Profile Saved", description: `Welcome, ${name}!` });
  }, [setCurrentUser, toast]);

  const handleCreateDirectChat = useCallback((recipientName: string) => {
    if (!currentUser) return;
    if (recipientName === currentUser.id) {
      toast({ title: "Error", description: "You cannot chat with yourself.", variant: "destructive" });
      return;
    }

    const participantIds = [currentUser.id, recipientName].sort();
    const chatId = `direct_${participantIds.join("_")}`;

    const existingChat = chats.find(c => c.id === chatId);
    if (existingChat) {
      setSelectedChat(existingChat);
      toast({ title: "Chat Exists", description: `Opened existing chat with ${recipientName}.` });
      return;
    }

    const newChat: Chat = {
      id: chatId,
      type: "direct",
      participants: participantIds,
      lastMessageTimestamp: Date.now(),
      avatarUrl: `https://placehold.co/100x100.png?text=${recipientName.substring(0,1)}`
    };
    setChats(prev => [newChat, ...prev]);
    setSelectedChat(newChat);
    setAllMessages(prev => ({ ...prev, [chatId]: [] }));
    toast({ title: "Chat Created", description: `Started a new chat with ${recipientName}.` });
  }, [currentUser, chats, setChats, setAllMessages, toast]);

  const handleCreateGroupChat = useCallback((groupName: string, memberNames: string[]) => {
    if (!currentUser) return;
    const chatId = `group_${groupName.replace(/\s+/g, "_")}_${Date.now()}`;
    const participants = Array.from(new Set([currentUser.id, ...memberNames]));

    const newChat: Chat = {
      id: chatId,
      type: "group",
      name: groupName,
      participants,
      lastMessageTimestamp: Date.now(),
      avatarUrl: `https://placehold.co/100x100.png?text=${groupName.substring(0,1)}`
    };
    setChats(prev => [newChat, ...prev]);
    setSelectedChat(newChat);
    setAllMessages(prev => ({ ...prev, [chatId]: [] }));
    toast({ title: "Group Created", description: `Group "${groupName}" is ready.` });
  }, [currentUser, setChats, setAllMessages, toast]);

  const handleSelectChat = useCallback((chat: Chat) => {
    setSelectedChat(chat);
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    if (!currentUser || !selectedChat) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      chatId: selectedChat.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      timestamp: Date.now(),
    };

    setAllMessages(prev => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage],
    }));

    setChats(prevChats => prevChats.map(chat => 
      chat.id === selectedChat.id 
        ? { ...chat, lastMessage: content, lastMessageTimestamp: newMessage.timestamp } 
        : chat
    ));
  }, [currentUser, selectedChat, setAllMessages, setChats]);
  
  const handleLogout = () => {
    setCurrentUser(null);
    setChats([]);
    setAllMessages({});
    setSelectedChat(null);
    toast({ title: "Logged Out", description: "Your session has been cleared." });
  };


  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <AppLogo className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }
  
  if (!currentUser) {
     // Simplified initial profile setup
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary/20 to-background">
        <div className="p-8 bg-card shadow-xl rounded-lg w-full max-w-md space-y-6">
            <div className="flex flex-col items-center space-y-2">
                 <AppLogo className="w-12 h-12 text-primary" />
                 <h1 className="text-2xl font-bold text-center text-foreground">Welcome to SimplicChat</h1>
                 <p className="text-sm text-muted-foreground text-center">Please set up your profile to begin.</p>
            </div>
           <UserProfileForm currentUser={null} onSaveProfile={handleSaveProfile} />
        </div>
      </div>
    );
  }


  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r" collapsible="icon" variant="sidebar">
          <SidebarHeader className="p-0">
             <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                    <AppLogo className="h-7 w-7 text-primary" />
                    <h1 className="text-xl font-semibold text-sidebar-primary-foreground">SimplicChat</h1>
                </div>
                <SidebarTrigger className="md:hidden" /> {/* Only show trigger on mobile inside sidebar */}
             </div>
            <UserProfileForm currentUser={currentUser} onSaveProfile={handleSaveProfile} />
          </SidebarHeader>
          <SidebarContent className="p-0">
            <ChatList
              chats={chats}
              currentUser={currentUser}
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChat?.id}
              onNewDirectChat={() => setIsNewDirectChatDialogOpen(true)}
              onNewGroupChat={() => setIsNewGroupChatDialogOpen(true)}
            />
          </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
             <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout & Clear Data
             </Button>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1">
           <div className="md:hidden p-2 border-b flex items-center"> {/* Mobile header for chat view */}
             <SidebarTrigger />
             {selectedChat && <span className="ml-2 font-semibold">{selectedChat.type === 'direct' ? (selectedChat.participants.find(p => p !== currentUser.id) || 'Direct Chat') : selectedChat.name}</span>}
           </div>
          {selectedChat ? (
            <ChatView
              chat={selectedChat}
              messages={allMessages[selectedChat.id] || []}
              currentUser={currentUser}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <WelcomeMessage />
          )}
        </SidebarInset>
      </div>

      <NewDirectChatDialog
        isOpen={isNewDirectChatDialogOpen}
        onOpenChange={setIsNewDirectChatDialogOpen}
        onCreateChat={handleCreateDirectChat}
        currentUserId={currentUser?.id}
      />
      <NewGroupChatDialog
        isOpen={isNewGroupChatDialogOpen}
        onOpenChange={setIsNewGroupChatDialogOpen}
        onCreateChat={handleCreateGroupChat}
        currentUserId={currentUser?.id}
      />
    </SidebarProvider>
  );
}

