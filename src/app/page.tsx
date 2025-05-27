
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


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
  }, []);


  const handleSaveProfile = useCallback((name: string) => {
    const userId = name.toLowerCase().replace(/\s+/g, "_") || `user_${Date.now()}`;
    const profile: User = { 
      id: userId, 
      name, 
      avatarUrl: `https://placehold.co/100x100.png?text=${name.substring(0,1)}`,
      status: "Online" // Status default
    };
    setCurrentUser(profile);
    toast({ title: "Profil Disimpan", description: `Selamat datang, ${name}!` });
  }, [setCurrentUser, toast]);

  const handleCreateDirectChat = useCallback((recipientName: string) => {
    if (!currentUser) return;
    // ID pengguna lain disamakan dengan nama untuk simplicitas
    const recipientId = recipientName.toLowerCase().replace(/\s+/g, "_") || `user_recipient_${Date.now()}`;

    if (recipientId === currentUser.id) {
      toast({ title: "Error", description: "Anda tidak bisa chat dengan diri sendiri.", variant: "destructive" });
      return;
    }

    const participantIds = [currentUser.id, recipientId].sort();
    const chatId = `direct_${participantIds.join("_")}`;

    const existingChat = chats.find(c => c.id === chatId);
    if (existingChat) {
      setSelectedChat(existingChat);
      toast({ title: "Chat Sudah Ada", description: `Membuka chat yang sudah ada dengan ${recipientName}.` });
      return;
    }
    
    // Untuk DM, avatarUrl bisa spesifik untuk penerima
    const recipientInitial = recipientName.substring(0,1) || 'R';
    const newChat: Chat = {
      id: chatId,
      type: "direct",
      participants: participantIds, // berisi currentUser.id dan recipientId
      lastMessageTimestamp: Date.now(),
      // Avatar untuk direct chat akan menggunakan inisial nama penerima
      avatarUrl: `https://placehold.co/100x100.png?text=${recipientInitial}`
    };
    setChats(prev => [newChat, ...prev].sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)));
    setSelectedChat(newChat);
    setAllMessages(prev => ({ ...prev, [chatId]: [] }));
    toast({ title: "Chat Dibuat", description: `Memulai chat baru dengan ${recipientName}.` });
  }, [currentUser, chats, setChats, setAllMessages, toast]);

  const handleCreateGroupChat = useCallback((groupName: string, memberNames: string[]) => {
    if (!currentUser) return;
    const memberIds = memberNames.map(name => name.toLowerCase().replace(/\s+/g, "_") || `user_member_${Date.now()}`);
    const chatId = `group_${groupName.replace(/\s+/g, "_")}_${Date.now()}`;
    const participants = Array.from(new Set([currentUser.id, ...memberIds]));
    const groupInitial = groupName.substring(0,1) || 'G';

    const newChat: Chat = {
      id: chatId,
      type: "group",
      name: groupName,
      participants,
      lastMessageTimestamp: Date.now(),
      avatarUrl: `https://placehold.co/100x100.png?text=${groupInitial}`
    };
    setChats(prev => [newChat, ...prev].sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)));
    setSelectedChat(newChat);
    setAllMessages(prev => ({ ...prev, [chatId]: [] }));
    toast({ title: "Grup Dibuat", description: `Grup "${groupName}" telah siap.` });
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
    ).sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)));
  }, [currentUser, selectedChat, setAllMessages, setChats]);
  
  const handleLogout = (clearData: boolean) => {
    setCurrentUser(null);
    setSelectedChat(null); 

    if (clearData) {
      setChats([]);
      setAllMessages({});
      toast({ title: "Logout Berhasil", description: "Sesi dan semua data Anda telah dihapus." });
    } else {
      toast({ title: "Logout Berhasil", description: "Sesi Anda telah dihapus. Data chat tetap tersimpan." });
    }
  };


  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <AppLogo className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary/20 to-background">
        <div className="p-8 bg-card shadow-xl rounded-lg w-full max-w-md space-y-6">
            <div className="flex flex-col items-center space-y-2">
                 <AppLogo className="w-12 h-12 text-primary" />
                 <h1 className="text-2xl font-bold text-center text-foreground">Selamat Datang di SimplicChat</h1>
                 <p className="text-sm text-muted-foreground text-center">Silakan atur profil Anda untuk memulai.</p>
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
                <SidebarTrigger className="md:hidden" />
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
          <SidebarFooter className="p-2 border-t border-sidebar-border space-y-1">
             <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground" onClick={() => handleLogout(false)}>
                <LogOut className="h-4 w-4" />
                Logout (Simpan Data)
             </Button>
             <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10" onClick={() => handleLogout(true)}>
                <Trash2 className="h-4 w-4" />
                Logout & Hapus Data
             </Button>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1">
           <div className="md:hidden p-2 border-b flex items-center">
             <SidebarTrigger />
             {selectedChat && <span className="ml-2 font-semibold">{selectedChat.type === 'direct' ? (selectedChat.participants.find(p => p !== currentUser.id)?.split('_').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ') || 'Direct Chat') : selectedChat.name}</span>}
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
