
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Trash2, Settings } from "lucide-react";
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
  
  // State untuk edit pesan di input utama
  const [editingMessageDetails, setEditingMessageDetails] = useState<Message | null>(null);


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
      avatarUrl: `https://placehold.co/100x100.png?text=${nameInitial}`, // Placeholder avatar
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
    const chatId = `direct_${participantsArray.map(p=>p.id).join("_")}`;


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
      lastReadBy: { 
        [currentUser.id]: now, 
        [recipientUser.id]: 0,  
      },
    };
    setChats(prev => [newChat, ...prev].sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0)));
    setSelectedChat(newChat);
    setAllMessages(prev => ({ ...prev, [chatId]: [] })); 
    toast({ title: "Permintaan Terkirim", description: `Permintaan chat telah dikirim ke ${recipientName}.` });
  }, [currentUser, chats, setChats, setAllMessages, toast]);

  const handleAcceptChatRequest = useCallback((chatId: string) => {
    let acceptedChatName = "Pengguna";
    setChats(prevChats => {
      const now = Date.now();
      const updatedChats = prevChats.map(chat => {
        if (chat.id === chatId && chat.pendingApprovalFromUserId === currentUser?.id) {
           const otherParticipant = chat.participants.find(p => p.id !== currentUser?.id);
           acceptedChatName = otherParticipant?.name || "Pengguna";
          return {
            ...chat,
            pendingApprovalFromUserId: undefined,
            isRejected: false,
            rejectedByUserId: undefined,
            lastMessage: "Permintaan chat diterima.",
            lastMessageTimestamp: now,
            lastReadBy: { 
              ...(chat.lastReadBy || {}),
              [currentUser!.id]: now, 
            },
          };
        }
        return chat;
      }).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
      
      const acceptedChat = updatedChats.find(c => c.id === chatId);
      if (acceptedChat) {
          setSelectedChat(acceptedChat); 
      }
      return updatedChats;
    });
    toast({ title: "Permintaan Diterima", description: `Anda sekarang dapat mengirim pesan dengan ${acceptedChatName}.` });

  }, [currentUser, setChats, toast]);

  const handleRejectChatRequest = useCallback((chatId: string) => {
    let rejectedChatName = "Pengguna";
    setChats(prevChats => {
      const now = Date.now();
      const updatedChats = prevChats.map(chat => {
        if (chat.id === chatId && chat.pendingApprovalFromUserId === currentUser?.id) {
          const otherParticipant = chat.participants.find(p => p.id !== currentUser?.id);
          rejectedChatName = otherParticipant?.name || "Pengguna";
          return {
            ...chat,
            pendingApprovalFromUserId: undefined,
            isRejected: true,
            rejectedByUserId: currentUser?.id,
            lastMessage: "Permintaan chat ditolak.",
            lastMessageTimestamp: now,
            lastReadBy: { 
              ...(chat.lastReadBy || {}),
              [currentUser!.id]: now, 
            },
          };
        }
        return chat;
      }).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
       if (selectedChat?.id === chatId) {
        setSelectedChat(null); 
      }
      return updatedChats;
    });
     toast({ title: "Permintaan Ditolak", description: `Anda menolak permintaan chat dari ${rejectedChatName}.`, variant: "destructive" });
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
    const initialLastReadBy: Record<string, number> = { [currentUser.id]: Date.now() }; 

    memberUsers.forEach(memberUser => {
      if (!allParticipantUsers.find(p => p.id === memberUser.id)) {
        allParticipantUsers.push(memberUser);
      }
      initialLastReadBy[memberUser.id] = 0; 
    });

    const newChat: Chat = {
      id: chatId,
      type: "group",
      name: groupName,
      participants: allParticipantUsers, 
      lastMessageTimestamp: Date.now(),
      avatarUrl: `https://placehold.co/100x100.png?text=${groupInitial}`,
      lastReadBy: initialLastReadBy, 
    };
    setChats(prev => [newChat, ...prev].sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0)));
    setSelectedChat(newChat);
    setAllMessages(prev => ({ ...prev, [chatId]: [] }));
    toast({ title: "Grup Dibuat", description: `Grup "${groupName}" telah siap.` });
  }, [currentUser, setChats, setAllMessages, toast]);

  const handleSelectChat = useCallback((chat: Chat) => {
    if (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser?.id) {
        toast({ title: "Menunggu Respon", description: "Permintaan chat belum diterima oleh pengguna lain." });
    }
    if (chat.isRejected) {
        const rejecterName = chat.rejectedByUserId === currentUser?.id ? "Anda" : chat.participants.find(p => p.id === chat.rejectedByUserId)?.name || "Pengguna lain";
        const rejectedTargetName = chat.rejectedByUserId === currentUser?.id ? (chat.participants.find(p => p.id !== currentUser?.id)?.name || "Pengguna lain") : "Anda";
        toast({ title: "Chat Ditolak", description: `${rejecterName} telah menolak permintaan dengan ${rejectedTargetName}.`, variant: "destructive"});
    }
    if (chat.pendingApprovalFromUserId === currentUser?.id) {
        toast({ title: "Tindakan Diperlukan", description: "Harap terima atau tolak permintaan chat ini dari daftar chat." });
    }

    setSelectedChat(chat);
    if (currentUser) {
      setChats(prevChats =>
        prevChats.map(c =>
          c.id === chat.id 
          ? { ...c, lastReadBy: { ...(c.lastReadBy || {}), [currentUser.id]: Date.now() } } 
          : c
        ).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0))
      );
    }
    // Batalkan mode edit jika memilih chat lain
    if (editingMessageDetails && editingMessageDetails.chatId !== chat.id) {
      setEditingMessageDetails(null);
    }
  }, [currentUser, toast, setChats, editingMessageDetails]);

  const handleSendMessage = useCallback((content: string, replyToMessage?: Message | null) => {
    if (!currentUser || !selectedChat) return;

    if (selectedChat.pendingApprovalFromUserId || selectedChat.isRejected) {
      toast({ title: "Tidak Dapat Mengirim Pesan", description: "Chat ini belum aktif atau telah ditolak.", variant: "destructive"});
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
        replyToMessageContent: replyToMessage.content.length > 70 ? replyToMessage.content.substring(0, 70) + "..." : replyToMessage.content,
        replyToMessageSenderName: replyToMessage.senderName,
      }),
    };

    setAllMessages(prev => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage],
    }));

    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === selectedChat.id) {
        return { 
          ...chat, 
          lastMessage: content, 
          lastMessageTimestamp: newMessage.timestamp,
          lastReadBy: { ...(chat.lastReadBy || {}), [currentUser.id]: newMessage.timestamp },
        };
      } else if (chat.id !== selectedChat.id && !chat.pendingApprovalFromUserId && !chat.isRejected) {
        // Untuk chat lain yang aktif, kita akan tetap memperbarui lastMessage dan lastMessageTimestamp
        // agar mereka ter-sortir ke atas dan bisa memicu perhitungan unread count yang benar
        return {
          ...chat,
          lastMessage: "Aktivitas baru", // Atau bisa juga konten pesan jika diinginkan
          lastMessageTimestamp: newMessage.timestamp 
        };
      }
      return chat;
    }).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0)));
  }, [currentUser, selectedChat, setAllMessages, setChats, toast]);

  const handleDeleteMessage = useCallback((messageId: string, chatId: string) => {
    let newLastMessageContent: string | undefined = undefined;
    let newLastMessageTimestamp: number | undefined = undefined;

    setAllMessages(prev => {
      const chatMessages = (prev[chatId] || []).filter(msg => msg.id !== messageId);
      const updatedChatMessages = { ...prev, [chatId]: chatMessages };
      
      const lastMessageInChat = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;
      if (lastMessageInChat) {
        newLastMessageContent = lastMessageInChat.content;
        newLastMessageTimestamp = lastMessageInChat.timestamp;
      }
      return updatedChatMessages;
    });

    setChats(prevChats => {
      return prevChats.map(c => {
        if (c.id === chatId) {
          const fallbackLastMessage = (c.type === 'direct' && (c.pendingApprovalFromUserId || c.isRejected) ? (c.lastMessage || "Status permintaan diperbarui") : "Belum ada pesan");
          const fallbackTimestamp = (c.requestTimestamp || c.lastMessageTimestamp || Date.now());
          return {
            ...c,
            lastMessage: newLastMessageContent !== undefined ? newLastMessageContent : fallbackLastMessage,
            lastMessageTimestamp: newLastMessageTimestamp !== undefined ? newLastMessageTimestamp : fallbackTimestamp,
          };
        }
        return c;
      }).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
    });
    // toast({ title: "Pesan Dihapus", description: "Pesan telah berhasil dihapus.", variant: "destructive" });
  }, [setAllMessages, setChats, toast]);

  const handleRequestEditMessageInInput = useCallback((messageToEdit: Message) => {
    if (!currentUser || messageToEdit.senderId !== currentUser.id) {
      toast({ title: "Gagal Edit", description: "Anda hanya bisa mengedit pesan Anda sendiri.", variant: "destructive" });
      return;
    }
    setEditingMessageDetails(messageToEdit);
    // ChatView akan mengisi input dengan messageToEdit.content
  }, [currentUser, toast]);

  const handleSaveEditedMessage = useCallback((messageId: string, newContent: string) => {
    if (!currentUser || !editingMessageDetails) return;

    if (newContent.trim() === "") {
      toast({ title: "Edit Gagal", description: "Konten pesan tidak boleh kosong.", variant: "destructive" });
      return;
    }
    if (newContent === editingMessageDetails.content) {
       toast({ title: "Info Pesan", description: "Konten pesan tidak berubah." });
       setEditingMessageDetails(null); // Keluar dari mode edit
       return;
    }

    const editedTimestamp = Date.now();
    let latestMessageDetailsForChat: { content: string; timestamp: number } | null = null;

    setAllMessages(prevAllMessages => {
      const chatMessages = (prevAllMessages[editingMessageDetails!.chatId] || []).map(msg =>
        msg.id === messageId ? { ...msg, content: newContent, isEdited: true, timestamp: editedTimestamp } : msg
      );
      const sortedChatMessages = [...chatMessages].sort((a, b) => a.timestamp - b.timestamp);
      
      if (sortedChatMessages.length > 0) {
        const lastMsg = sortedChatMessages[sortedChatMessages.length - 1];
        latestMessageDetailsForChat = { content: lastMsg.content, timestamp: lastMsg.timestamp };
      } else {
        latestMessageDetailsForChat = null; 
      }
      return { ...prevAllMessages, [editingMessageDetails!.chatId]: sortedChatMessages };
    });
      
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === editingMessageDetails!.chatId) {
          if (latestMessageDetailsForChat) {
            return { 
              ...chat, 
              lastMessage: latestMessageDetailsForChat.content, 
              lastMessageTimestamp: latestMessageDetailsForChat.timestamp 
            };
          } else {
             const fallbackMsg = (chat.type === 'direct' && (chat.pendingApprovalFromUserId || chat.isRejected) ? (chat.lastMessage || "Status permintaan diperbarui") : "Belum ada pesan");
             const fallbackTs = (chat.requestTimestamp || chat.lastMessageTimestamp || Date.now());
             return { 
               ...chat, 
               lastMessage: fallbackMsg, 
               lastMessageTimestamp: fallbackTs
             };
          }
        }
        return chat;
      });
      return updatedChats.sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
    });

    toast({ title: "Pesan Diedit", description: "Pesan Anda telah berhasil diperbarui." });
    setEditingMessageDetails(null); // Keluar dari mode edit
  }, [currentUser, setAllMessages, setChats, toast, editingMessageDetails]);

  const handleCancelEditInInput = useCallback(() => {
    setEditingMessageDetails(null);
  }, []);


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
    setEditingMessageDetails(null); // Pastikan mode edit juga dibatalkan saat logout

    if (clearData) {
      setChats([]);
      setAllMessages({});
      if (typeof window !== "undefined") {
        Object.keys(window.localStorage).forEach(key => {
          if (key.startsWith(LS_MESSAGES_PREFIX) && key !== `${LS_MESSAGES_PREFIX}all`) {
            window.localStorage.removeItem(key);
          }
        });
      }
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
    return <UserProfileForm currentUser={null} onSaveProfile={handleSaveProfile} />;
  }


  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r" collapsible="icon" variant="sidebar">
          <SidebarHeader className="p-0">
             <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2 shrink-0 mr-2"> {/* Added shrink-0 and mr-2 */}
                    <AppLogo className="h-7 w-7 text-primary" />
                    <h1 className="text-xl font-semibold text-sidebar-primary-foreground">SimplicChat</h1>
                </div>
                <div className="flex items-center gap-2">
                    {currentUser && (
                        <UserProfileForm
                            currentUser={currentUser}
                            onSaveProfile={handleSaveProfile}
                            displayMode="compact"
                        />
                    )}
                    <SidebarTrigger className="md:hidden" />
                </div>
             </div>
          </SidebarHeader>
          <SidebarContent className="p-0">
            <ChatList
              chats={chats}
              currentUser={currentUser}
              allMessages={allMessages}
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChat?.id}
              onNewDirectChat={() => setIsNewDirectChatDialogOpen(true)}
              onNewGroupChat={() => setIsNewGroupChatDialogOpen(true)}
              onAcceptChat={handleAcceptChatRequest}
              onRejectChat={handleRejectChatRequest}
              onDeleteChatPermanently={handleDeleteChatPermanently}
            />
          </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground">
                  <Settings className="h-4 w-4" />
                  Pengaturan & Logout
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>Opsi Akun</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleLogout(false)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout (Simpan Data)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLogout(true)} className="text-destructive hover:!text-destructive focus:!text-destructive focus:!bg-destructive/10 hover:!bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Logout & Hapus Data</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col">
           <div className="md:hidden p-2 border-b flex items-center">
             <SidebarTrigger />
             {selectedChat && <span className="ml-2 font-semibold truncate max-w-[calc(100vw-100px)]">
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
              editingMessageDetails={editingMessageDetails}
              onSaveEditedMessage={handleSaveEditedMessage}
              onRequestEditMessage={handleRequestEditMessageInInput}
              onCancelEditMessage={handleCancelEditInInput}
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
    

