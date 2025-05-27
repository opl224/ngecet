
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
    const nameInitial = name.substring(0,1).toUpperCase() || 'U';
    const profile: User = {
      id: userId,
      name,
      avatarUrl: `https://placehold.co/100x100.png?text=${nameInitial}`,
      status: "Online"
    };
    setCurrentUser(profile);
    toast({ title: "Profil Disimpan", description: `Selamat datang, ${name}!` });
  }, [setCurrentUser, toast]);

  const handleCreateDirectChat = useCallback((recipientName: string) => {
    if (!currentUser) return;
    const recipientId = recipientName.toLowerCase().replace(/\s+/g, "_") || `user_recipient_${Date.now()}`;

    if (recipientId === currentUser.id) {
      toast({ title: "Error", description: "Anda tidak bisa chat dengan diri sendiri.", variant: "destructive" });
      return;
    }
    
    const recipientInitial = recipientName.substring(0,1).toUpperCase() || 'R';
    const recipientUser: User = {
      id: recipientId,
      name: recipientName,
      avatarUrl: `https://placehold.co/100x100.png?text=${recipientInitial}`,
      status: "Offline" 
    };

    const participantsArray: User[] = [currentUser, recipientUser].sort((a, b) => a.id.localeCompare(b.id));
    const chatParticipantIds = participantsArray.map(p => p.id);
    const chatId = `direct_${chatParticipantIds.join("_")}`;

    const existingChat = chats.find(c => c.id === chatId);
    if (existingChat) {
      setSelectedChat(existingChat);
      if (existingChat.pendingApprovalFromUserId === currentUser.id) {
        toast({ title: "Permintaan Tertunda", description: `Anda memiliki permintaan chat dari ${recipientName}. Terima atau tolak dari daftar chat.` });
      } else if (existingChat.pendingApprovalFromUserId) {
        toast({ title: "Permintaan Terkirim", description: `Anda sudah mengirim permintaan ke ${recipientName}. Menunggu respon.` });
      } else if (existingChat.isRejected) {
         toast({ title: "Chat Ditolak", description: `Permintaan chat dengan ${recipientName} sebelumnya ditolak.` });
      }
      else {
        toast({ title: "Chat Sudah Ada", description: `Membuka chat yang sudah ada dengan ${recipientName}.` });
      }
      return;
    }
    const now = Date.now();
    const newChat: Chat = {
      id: chatId,
      type: "direct",
      participants: participantsArray,
      name: recipientUser.name, 
      avatarUrl: recipientUser.avatarUrl,
      pendingApprovalFromUserId: recipientUser.id, 
      isRejected: false,
      requestTimestamp: now,
      lastMessage: "Permintaan chat dikirim...",
      lastMessageTimestamp: now,
    };
    setChats(prev => [newChat, ...prev].sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)));
    setSelectedChat(newChat);
    setAllMessages(prev => ({ ...prev, [chatId]: [] })); 
    toast({ title: "Permintaan Terkirim", description: `Permintaan chat telah dikirim ke ${recipientName}.` });
  }, [currentUser, chats, setChats, setAllMessages, toast]);

  const handleAcceptChatRequest = useCallback((chatId: string) => {
    setChats(prevChats => {
      const now = Date.now();
      return prevChats.map(chat => {
        if (chat.id === chatId && chat.pendingApprovalFromUserId === currentUser?.id) {
          toast({ title: "Permintaan Diterima", description: `Anda sekarang dapat mengirim pesan.` });
          return {
            ...chat,
            pendingApprovalFromUserId: undefined,
            isRejected: false,
            rejectedByUserId: undefined,
            lastMessage: "Permintaan chat diterima.",
            lastMessageTimestamp: now,
          };
        }
        return chat;
      }).sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
    });
    
    const acceptedChat = chats.find(c => c.id === chatId);
    if (acceptedChat) {
        const updatedAcceptedChat = {
            ...acceptedChat,
            pendingApprovalFromUserId: undefined,
            isRejected: false,
            rejectedByUserId: undefined,
            lastMessage: "Permintaan chat diterima.",
            lastMessageTimestamp: Date.now(),
        };
        setSelectedChat(updatedAcceptedChat);
    }

  }, [currentUser, setChats, toast, chats]);

  const handleRejectChatRequest = useCallback((chatId: string) => {
    setChats(prevChats => {
      const now = Date.now();
      return prevChats.map(chat => {
        if (chat.id === chatId && chat.pendingApprovalFromUserId === currentUser?.id) {
          toast({ title: "Permintaan Ditolak", variant: "destructive" });
          return {
            ...chat,
            pendingApprovalFromUserId: undefined,
            isRejected: true,
            rejectedByUserId: currentUser?.id,
            lastMessage: "Permintaan chat ditolak.",
            lastMessageTimestamp: now,
          };
        }
        return chat;
      }).sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
    });
    if (selectedChat?.id === chatId) {
      setSelectedChat(null); 
    }
  }, [currentUser, setChats, toast, selectedChat?.id]);


  const handleCreateGroupChat = useCallback((groupName: string, memberNames: string[]) => {
    if (!currentUser) return;

    const groupInitial = groupName.substring(0,1).toUpperCase() || 'G';
    const chatId = `group_${groupName.replace(/\s+/g, "_")}_${Date.now()}`;

    const memberUsers: User[] = memberNames.map(name => {
      const memberId = name.toLowerCase().replace(/\s+/g, "_") || `user_member_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
      const memberInitial = name.substring(0,1).toUpperCase() || 'M';
      return {
        id: memberId,
        name: name,
        avatarUrl: `https://placehold.co/100x100.png?text=${memberInitial}`,
        status: "Offline"
      };
    });

    const allParticipantUsers: User[] = [currentUser];
    memberUsers.forEach(memberUser => {
      if (!allParticipantUsers.find(p => p.id === memberUser.id)) {
        allParticipantUsers.push(memberUser);
      }
    });

    const newChat: Chat = {
      id: chatId,
      type: "group",
      name: groupName,
      participants: allParticipantUsers,
      lastMessageTimestamp: Date.now(),
      avatarUrl: `https://placehold.co/100x100.png?text=${groupInitial}`
    };
    setChats(prev => [newChat, ...prev].sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)));
    setSelectedChat(newChat);
    setAllMessages(prev => ({ ...prev, [chatId]: [] }));
    toast({ title: "Grup Dibuat", description: `Grup "${groupName}" telah siap.` });
  }, [currentUser, setChats, setAllMessages, toast]);

  const handleSelectChat = useCallback((chat: Chat) => {
    if (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser?.id) {
        toast({ title: "Menunggu Respon", description: "Permintaan chat belum diterima oleh pengguna lain." });
        return;
    }
    if (chat.isRejected) {
        toast({ title: "Chat Ditolak", description: "Permintaan chat ini telah ditolak.", variant: "destructive"});
        return;
    }
    if (chat.pendingApprovalFromUserId === currentUser?.id) {
        toast({ title: "Tindakan Diperlukan", description: "Harap terima atau tolak permintaan chat ini dari daftar chat." });
        return;
    }
    setSelectedChat(chat);
  }, [currentUser?.id, toast]);

  const handleSendMessage = useCallback((content: string, replyToMessage?: Message | null) => {
    if (!currentUser || !selectedChat) return;

    if (selectedChat.pendingApprovalFromUserId || selectedChat.isRejected) {
      toast({ title: "Tidak Dapat Mengirim Pesan", description: "Chat ini belum aktif.", variant: "destructive"});
      return;
    }

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      chatId: selectedChat.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      timestamp: Date.now(),
      isEdited: false,
      ...(replyToMessage && {
        replyToMessageId: replyToMessage.id,
        replyToMessageContent: replyToMessage.content.length > 50 ? replyToMessage.content.substring(0, 50) + "..." : replyToMessage.content,
        replyToMessageSenderName: replyToMessage.senderName,
      }),
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
  }, [currentUser, selectedChat, setAllMessages, setChats, toast]);

  const handleDeleteMessage = useCallback((messageId: string, chatId: string) => {
    setAllMessages(prev => {
      const chatMessages = (prev[chatId] || []).filter(msg => msg.id !== messageId);
      return { ...prev, [chatId]: chatMessages };
    });

    setChats(prevChats => {
      const chatMessages = (allMessages[chatId] || []).filter(msg => msg.id !== messageId);
      const lastMessageInChat = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;

      return prevChats.map(c =>
        c.id === chatId
          ? {
              ...c,
              lastMessage: lastMessageInChat ? lastMessageInChat.content : "No messages yet",
              lastMessageTimestamp: lastMessageInChat ? lastMessageInChat.timestamp : (c.requestTimestamp || c.lastMessageTimestamp),
            }
          : c
      ).sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
    });
    toast({ title: "Pesan Dihapus", description: "Pesan telah berhasil dihapus.", variant: "destructive" });
  }, [setAllMessages, setChats, allMessages, toast]);

  const handleEditMessage = useCallback((messageToEdit: Message) => {
    if (!currentUser || messageToEdit.senderId !== currentUser.id) {
      toast({ title: "Gagal Edit", description: "Anda hanya bisa mengedit pesan Anda sendiri.", variant: "destructive" });
      return;
    }
    const newContent = window.prompt("Edit pesan Anda:", messageToEdit.content);
    if (newContent !== null && newContent.trim() !== "" && newContent !== messageToEdit.content) {
      setAllMessages(prev => {
        const chatMessages = (prev[messageToEdit.chatId] || []).map(msg =>
          msg.id === messageToEdit.id ? { ...msg, content: newContent, isEdited: true, timestamp: Date.now() } : msg
        );
        return { ...prev, [messageToEdit.chatId]: chatMessages };
      });

      const currentChatMessages = (allMessages[messageToEdit.chatId] || []).filter(msg => msg.id !== messageToEdit.id);
      const updatedEditedMessage = { ...messageToEdit, content: newContent, isEdited: true, timestamp: Date.now() };
      const fullChatMessagesAfterEdit = [...currentChatMessages, updatedEditedMessage].sort((a,b) => a.timestamp - b.timestamp);

      setChats(prevChats => prevChats.map(c => {
        if (c.id === messageToEdit.chatId) {
            const lastMsg = fullChatMessagesAfterEdit.length > 0 ? fullChatMessagesAfterEdit[fullChatMessagesAfterEdit.length -1] : null;
            if (lastMsg?.id === messageToEdit.id) {
                 return { ...c, lastMessage: newContent, lastMessageTimestamp: updatedEditedMessage.timestamp };
            } else if (lastMsg) {
                 return { ...c, lastMessage: lastMsg.content, lastMessageTimestamp: lastMsg.timestamp };
            }
        }
        return c;
      }).sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)));

      toast({ title: "Pesan Diedit", description: "Pesan Anda telah berhasil diperbarui." });
    } else if (newContent === messageToEdit.content) {
      // No change
    } else if (newContent !== null) { 
      toast({ title: "Edit Gagal", description: "Konten pesan tidak boleh kosong.", variant: "destructive" });
    } else { 
      toast({ title: "Edit Dibatalkan", description: "Tidak ada perubahan pada pesan.", variant: "default" });
    }
  }, [currentUser, setAllMessages, setChats, allMessages, toast]);

  const handleDeleteChatPermanently = useCallback((chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    setAllMessages(prevAllMessages => {
      const newAllMessages = { ...prevAllMessages };
      delete newAllMessages[chatId];
      return newAllMessages;
    });
    if (selectedChat?.id === chatId) {
      setSelectedChat(null);
    }
    toast({ title: "Chat Dihapus", description: "Chat telah dihapus secara permanen.", variant: "destructive" });
  }, [setChats, setAllMessages, selectedChat?.id, toast]);

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
              onAcceptChat={handleAcceptChatRequest}
              onRejectChat={handleRejectChatRequest}
              onDeleteChatPermanently={handleDeleteChatPermanently}
            />
          </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border space-y-1">
             <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground" onClick={() => handleLogout(false)}>
                <LogOut className="h-4 w-4" />
                Logout (Simpan Data)
             </Button>
             <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive-foreground hover:bg-destructive/10 focus:text-destructive-foreground focus:bg-destructive/10" onClick={() => handleLogout(true)}>
                <Trash2 className="h-4 w-4" />
                Logout & Hapus Data
             </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
           <div className="md:hidden p-2 border-b flex items-center">
             <SidebarTrigger />
             {selectedChat && <span className="ml-2 font-semibold">
                {selectedChat.type === 'direct' && selectedChat.participants
                    ? selectedChat.participants.find(p => p.id !== currentUser.id)?.name || 'Direct Chat'
                    : selectedChat.name || 'Group Chat'}
                </span>}
           </div>
          {selectedChat ? (
            <ChatView
              chat={selectedChat}
              messages={allMessages[selectedChat.id] || []}
              currentUser={currentUser}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
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

    