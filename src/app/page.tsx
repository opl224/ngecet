
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
import { AddUserToGroupDialog } from "@/components/chat/AddUserToGroupDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { LogOut, Trash2, Settings, ArrowLeft, ShieldOff, ShieldAlert, InfoIcon, UserPlus, UserMinus, MessageSquarePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


const LS_USER_KEY = "ngecet_user";
const LS_CHATS_KEY = "ngecet_chats";
const LS_MESSAGES_PREFIX = "ngecet_messages_";

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
  const [editingMessageDetails, setEditingMessageDetails] = useState<Message | null>(null);

  const [isAddUserToGroupDialogOpen, setIsAddUserToGroupDialogOpen] = useState(false);
  const [chatIdToAddTo, setChatIdToAddTo] = useState<string | null>(null);

  const [isDeleteGroupConfirmOpen, setIsDeleteGroupConfirmOpen] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);
  const [groupDialogInitialMemberName, setGroupDialogInitialMemberName] = useState<string | null>(null);

  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);


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
      status: "Offline" // Default status for new contact
    };

    const participantsArray: User[] = [currentUser, recipientUser].sort((a, b) => a.id.localeCompare(b.id));
    const chatId = `direct_${participantsArray.map(p=>p.id).join("_")}`;


    const existingChat = chats.find(c => c.id === chatId);
    if (existingChat) {
      setSelectedChat(existingChat);
      if (existingChat.blockedByUser === currentUser.id) {
        toast({ title: "Diblokir", description: `Anda telah memblokir ${recipientName}. Buka blokir untuk melanjutkan.`, variant: "destructive" });
        return;
      }
      if (existingChat.blockedByUser === recipientUser.id) {
        toast({ title: "Info", description: `Anda mungkin diblokir oleh ${recipientName}.`, variant: "default" });
      }
      if (existingChat.pendingApprovalFromUserId === currentUser.id) {
        toast({ title: "Permintaan Tertunda", description: `Anda memiliki permintaan chat dari ${recipientName}. Terima atau tolak dari daftar chat.` });
      } else if (existingChat.pendingApprovalFromUserId) {
        toast({ title: "Permintaan Terkirim", description: `Anda sudah mengirim permintaan ke ${recipientName}. Menunggu respon.` });
      } else if (existingChat.isRejected) {
         toast({ title: "Chat Ditolak", description: `Permintaan chat dengan ${recipientName} sebelumnya ditolak.` });
      }
      else if (!existingChat.blockedByUser) {
        toast({ title: "Chat Sudah Ada", description: `Membuka chat yang sudah ada dengan ${recipientName}.` });
      }
      return;
    }
    const now = Date.now();
    const newChat: Chat = {
      id: chatId,
      type: "direct",
      participants: participantsArray,
      name: recipientUser.name, // Store other participant's name for ChatItem
      avatarUrl: recipientUser.avatarUrl, // Store other participant's avatar for ChatItem
      pendingApprovalFromUserId: recipientUser.id,
      isRejected: false,
      requestTimestamp: now,
      lastMessage: "Permintaan chat dikirim...",
      lastMessageTimestamp: now,
      lastReadBy: {
        [currentUser.id]: now,
        [recipientUser.id]: 0,
      },
      clearedTimestamp: {},
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


  const handleCreateGroupChat = useCallback((groupName: string, memberDisplayNames: string[]) => {
    if (!currentUser) return;

    const invalidMemberDisplayNames: string[] = [];
    const finalMemberUsers: User[] = [currentUser]; // Creator is always a member

    for (const name of memberDisplayNames) {
        const memberId = name.toLowerCase().replace(/\s+/g, "_") || `user_member_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;

        if (memberId === currentUser.id) {
            // User trying to add themselves explicitly, already included
            continue;
        }
        if (finalMemberUsers.find(u => u.id === memberId)) {
            // Already added to the list for this group creation
            continue;
        }
        // Check for existing active direct chat
        const potentialDirectChatIdParts = [currentUser.id, memberId].sort();
        const potentialDirectChatId = `direct_${potentialDirectChatIdParts[0]}_${potentialDirectChatIdParts[1]}`;
        const existingDirectChat = chats.find(c => c.id === potentialDirectChatId);

        if (existingDirectChat && !existingDirectChat.pendingApprovalFromUserId && !existingDirectChat.isRejected && existingDirectChat.blockedByUser !== currentUser.id && existingDirectChat.blockedByUser !== memberId) {
            // Direct chat exists and is active, get the user object from there
            const memberUserObject = existingDirectChat.participants.find(p => p.id === memberId);
            if (memberUserObject) {
                finalMemberUsers.push(memberUserObject);
            } else { // Should not happen if direct chat exists and is valid
                 const memberInitial = name.substring(0,1).toUpperCase() || 'M';
                finalMemberUsers.push({
                    id: memberId, name: name,
                    avatarUrl: `https://placehold.co/100x100.png?text=${memberInitial}`,
                    status: "Offline" // Default for users not yet interacted with (though this path is for active chats)
                });
            }
        } else {
            // No active direct chat, or chat is pending/rejected/blocked
            let reason = `Anda tidak memiliki chat langsung yang aktif dengan mereka`;
            if (existingDirectChat?.blockedByUser === currentUser.id) reason = `Anda telah memblokir mereka`;
            else if (existingDirectChat?.blockedByUser === memberId) reason = `Mereka telah memblokir Anda`;
            else if (existingDirectChat?.pendingApprovalFromUserId) reason = `permintaan chat dengan mereka masih tertunda`;
            else if (existingDirectChat?.isRejected) reason = `chat dengan mereka sebelumnya ditolak`;

            invalidMemberDisplayNames.push(`${name} (${reason})`);
        }
    }

    if (invalidMemberDisplayNames.length > 0) {
        toast({
            title: "Gagal Membuat Grup",
            description: `Pengguna berikut tidak dapat ditambahkan: ${invalidMemberDisplayNames.join("; ")}. Pastikan Anda memiliki chat langsung yang aktif dengan mereka.`,
            variant: "destructive",
            duration: 7000,
        });
        return;
    }

    if (finalMemberUsers.length < 2 && memberDisplayNames.length > 0) { // Check if after filtering, only creator is left but members were intended
        toast({
            title: "Gagal Membuat Grup",
            description: "Tidak ada anggota valid yang dapat ditambahkan selain diri Anda.",
            variant: "destructive",
        });
        return;
    }
     if (finalMemberUsers.length < 2) { // If even no members were attempted to be added, and it's just the creator
         toast({
            title: "Anggota Diperlukan",
            description: "Harap tambahkan minimal satu anggota lain yang valid.",
            variant: "destructive",
        });
        return;
    }


    const groupInitial = groupName.substring(0,1).toUpperCase() || 'G';
    const chatId = `group_${groupName.replace(/\s+/g, "_")}_${Date.now()}`;
    const now = Date.now();

    const initialLastReadBy: Record<string, number> = {};
    const initialClearedTimestamp: Record<string, number> = {};

    finalMemberUsers.forEach(p => {
        initialLastReadBy[p.id] = p.id === currentUser.id ? now : 0;
        initialClearedTimestamp[p.id] = 0;
    });

    const newChat: Chat = {
      id: chatId,
      type: "group",
      name: groupName,
      participants: finalMemberUsers,
      lastMessage: "Grup telah dibuat.",
      lastMessageTimestamp: now,
      avatarUrl: `https://placehold.co/100x100.png?text=${groupInitial}`,
      lastReadBy: initialLastReadBy,
      clearedTimestamp: initialClearedTimestamp,
      createdByUserId: currentUser.id, // Set creator ID
    };
    setChats(prev => [newChat, ...prev].sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0)));
    setSelectedChat(newChat);
    setAllMessages(prev => ({ ...prev, [chatId]: [] }));
    toast({ title: "Grup Dibuat", description: `Grup "${groupName}" telah siap.` });
  }, [currentUser, chats, setChats, setAllMessages, toast]);

  const handleSelectChat = useCallback((chat: Chat) => {
    if (chat.type === "direct" && chat.blockedByUser === currentUser?.id) {
        toast({ title: "Chat Diblokir", description: "Anda telah memblokir pengguna ini. Buka blokir untuk melanjutkan." });
    } else if (chat.type === "direct" && chat.blockedByUser && chat.blockedByUser !== currentUser?.id) {
        toast({ title: "Interaksi Terbatas", description: "Anda tidak dapat berinteraksi dalam chat ini saat ini." });
    } else if (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser?.id) {
        toast({ title: "Menunggu Respon", description: "Permintaan chat belum diterima oleh pengguna lain." });
    } else if (chat.isRejected) {
        const rejecterName = chat.rejectedByUserId === currentUser?.id ? "Anda" : chat.participants.find(p => p.id === chat.rejectedByUserId)?.name || "Pengguna lain";
        const rejectedTargetName = chat.rejectedByUserId === currentUser?.id ? (chat.participants.find(p => p.id !== currentUser?.id)?.name || "Pengguna lain") : "Anda";
        toast({ title: "Chat Ditolak", description: `${rejecterName} telah menolak permintaan dengan ${rejectedTargetName}.`, variant: "destructive"});
    } else if (chat.pendingApprovalFromUserId === currentUser?.id) {
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
    if (editingMessageDetails && editingMessageDetails.chatId !== chat.id) {
      setEditingMessageDetails(null);
    }
  }, [currentUser, toast, setChats, editingMessageDetails]);

  const handleSendMessage = useCallback((content: string, replyToMessage?: Message | null) => {
    if (!currentUser || !selectedChat) return;

    if (selectedChat.type === 'direct' && selectedChat.blockedByUser === currentUser.id) {
      toast({ title: "Tidak Dapat Mengirim Pesan", description: "Anda telah memblokir pengguna ini.", variant: "destructive"});
      return;
    }
    if (selectedChat.type === 'direct' && selectedChat.blockedByUser && selectedChat.blockedByUser !== currentUser.id) {
      toast({ title: "Tidak Dapat Mengirim Pesan", description: "Anda tidak dapat mengirim pesan ke pengguna ini saat ini.", variant: "destructive"});
      return;
    }
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
      }
      // Update lastMessage and timestamp for other active chats to reflect new activity
      if (chat.id !== selectedChat.id && !chat.pendingApprovalFromUserId && !chat.isRejected && !chat.blockedByUser) {
         return {
          ...chat,
          lastMessage: chat.type === 'direct' ? `Aktivitas baru di chat dengan ${chat.participants.find(p=>p.id !== currentUser.id)?.name || 'seseorang'}` : `Aktivitas baru di ${chat.name}`,
          lastMessageTimestamp: newMessage.timestamp,
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
          let fallbackLastMessage = "Belum ada pesan";
          if (c.type === 'direct') {
            if (c.blockedByUser === currentUser?.id) fallbackLastMessage = "Anda memblokir pengguna ini.";
            else if (c.blockedByUser) fallbackLastMessage = "Interaksi terbatas.";
            else if (c.pendingApprovalFromUserId || c.isRejected) fallbackLastMessage = c.lastMessage || "Status permintaan diperbarui";
          } else if (c.type === 'group' && (!newLastMessageContent || c.participants.length === 0) ){
            fallbackLastMessage = c.lastMessage || "Grup telah dibuat.";
          }

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
  }, [setAllMessages, setChats, currentUser]);

  const handleRequestEditMessageInInput = useCallback((messageToEdit: Message) => {
    if (!currentUser || messageToEdit.senderId !== currentUser.id) {
      toast({ title: "Gagal Edit", description: "Anda hanya bisa mengedit pesan Anda sendiri.", variant: "destructive" });
      return;
    }
    const chat = chats.find(c => c.id === messageToEdit.chatId);
    if (chat?.type === 'direct' && chat.blockedByUser) {
        toast({ title: "Gagal Edit", description: "Tidak dapat mengedit pesan dalam chat yang diblokir.", variant: "destructive" });
        return;
    }
    setEditingMessageDetails(messageToEdit);
  }, [currentUser, toast, chats]);

  const handleSaveEditedMessage = useCallback((messageId: string, newContent: string) => {
    if (!currentUser || !editingMessageDetails) return;

    if (newContent.trim() === "") {
      toast({ title: "Edit Gagal", description: "Konten pesan tidak boleh kosong.", variant: "destructive" });
      return;
    }
     if (newContent === editingMessageDetails.content) {
       toast({ title: "Info Pesan", description: "Konten pesan tidak berubah." });
       setEditingMessageDetails(null);
       return;
    }

    const editedTimestamp = Date.now();
    let latestMessageDetailsForChat: { content: string; timestamp: number } | null = null;

    setAllMessages(prevAllMessages => {
      const chatMessages = (prevAllMessages[editingMessageDetails!.chatId] || []).map(msg =>
        msg.id === messageId ? { ...msg, content: newContent, isEdited: true, timestamp: editedTimestamp } : msg
      );
      // Re-sort messages by timestamp after edit to maintain order
      const sortedChatMessages = [...chatMessages].sort((a, b) => a.timestamp - b.timestamp);

      if (sortedChatMessages.length > 0) {
        const lastMsg = sortedChatMessages[sortedChatMessages.length - 1];
        latestMessageDetailsForChat = { content: lastMsg.content, timestamp: lastMsg.timestamp };
      }
      return { ...prevAllMessages, [editingMessageDetails!.chatId]: sortedChatMessages };
    });

    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === editingMessageDetails!.chatId) {
          // Ensure last message reflects the actual last message after edit & sort
          if (latestMessageDetailsForChat) {
            return {
              ...chat,
              lastMessage: latestMessageDetailsForChat.content,
              lastMessageTimestamp: latestMessageDetailsForChat.timestamp
            };
          } else { // Fallback if chat becomes empty after edit (should not happen if newContent is not empty)
             let fallbackMsg = "Belum ada pesan";
              if (chat.type === 'direct') {
                if (chat.blockedByUser === currentUser?.id) fallbackMsg = "Anda memblokir pengguna ini.";
                else if (chat.blockedByUser) fallbackMsg = "Interaksi terbatas.";
                else if (chat.pendingApprovalFromUserId || chat.isRejected) fallbackMsg = chat.lastMessage || "Status permintaan diperbarui";
              } else if (chat.type === 'group' ){
                 fallbackMsg = chat.lastMessage || "Grup telah dibuat.";
              }
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
      // Re-sort all chats by their last message timestamp
      return updatedChats.sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
    });

    toast({ title: "Pesan Diedit", description: "Pesan Anda telah berhasil diperbarui." });
    setEditingMessageDetails(null);
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
    setEditingMessageDetails(null);

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

  const handleGoBack = useCallback(() => {
    setSelectedChat(null);
    setEditingMessageDetails(null);
  }, []);

  const handleDeleteAllMessagesInChat = useCallback((chatId: string) => {
    if (!currentUser) return;
    const now = Date.now();
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: "Semua pesan telah dihapus.",
            lastMessageTimestamp: now,
            lastReadBy: { ...(chat.lastReadBy || {}), [currentUser.id]: now },
            clearedTimestamp: {
              ...(chat.clearedTimestamp || {}),
              [currentUser.id]: now,
            }
          };
        }
        return chat;
      }).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0))
    );
    toast({ title: "Tampilan Pesan Dikosongkan", description: "Riwayat pesan sebelumnya dalam chat ini telah disembunyikan untuk Anda." });
  }, [currentUser, setChats, toast]);

  const handleOpenAddUserToGroupDialog = useCallback((chatId: string) => {
    setChatIdToAddTo(chatId);
    setIsAddUserToGroupDialogOpen(true);
  }, []);

  const handleAddNewUserToGroup = useCallback((userName: string) => {
    if (!currentUser || !chatIdToAddTo) {
        toast({ title: "Gagal Menambahkan", description: "Informasi tidak lengkap.", variant: "destructive" });
        return;
    }

    const newUserId = userName.toLowerCase().replace(/\s+/g, "_") || `user_new_${Date.now()}`;

    const chatToUpdate = chats.find(c => c.id === chatIdToAddTo);
    if (!chatToUpdate || chatToUpdate.type !== 'group') {
        toast({ title: "Error", description: "Grup tidak ditemukan atau chat bukan grup.", variant: "destructive" });
        return;
    }
    if (chatToUpdate.participants.find(p => p.id === newUserId)) {
        toast({ title: "Info", description: `${userName} sudah menjadi anggota grup.`, variant: "default" });
        return;
    }

    // Check for existing active direct chat
    const potentialDirectChatIdParts = [currentUser.id, newUserId].sort();
    const potentialDirectChatId = `direct_${potentialDirectChatIdParts[0]}_${potentialDirectChatIdParts[1]}`;
    const existingDirectChat = chats.find(c => c.id === potentialDirectChatId);

    let userObjectToAdd: User;

    if (existingDirectChat && !existingDirectChat.pendingApprovalFromUserId && !existingDirectChat.isRejected && existingDirectChat.blockedByUser !== currentUser.id && existingDirectChat.blockedByUser !== newUserId) {
        const foundUser = existingDirectChat.participants.find(p => p.id === newUserId);
        if (!foundUser) { // Should not happen if direct chat is valid
            toast({ title: "Error Internal", description: `Tidak dapat menemukan detail untuk ${userName}. Coba mulai chat langsung dulu.`, variant: "destructive" });
            return;
        }
        userObjectToAdd = foundUser;
    } else {
        let reason = "Anda harus memiliki chat langsung yang aktif dengannya terlebih dahulu.";
        if (existingDirectChat) {
            if (existingDirectChat.blockedByUser === currentUser.id) reason = `Anda telah memblokir ${userName}.`;
            else if (existingDirectChat.blockedByUser === newUserId) reason = `${userName} telah memblokir Anda.`;
            else if (existingDirectChat.pendingApprovalFromUserId === newUserId) reason = `permintaan chat Anda kepada ${userName} masih tertunda.`;
            else if (existingDirectChat.pendingApprovalFromUserId === currentUser.id) reason = `Anda belum menerima permintaan chat dari ${userName}.`;
            else if (existingDirectChat.isRejected) reason = `chat langsung dengan ${userName} sebelumnya ditolak.`;
        }
        toast({ title: "Penambahan Gagal", description: `Tidak dapat menambahkan ${userName}. ${reason}`, variant: "destructive", duration: 7000 });
        return;
    }

    const now = Date.now();
    const systemMessage = `${userObjectToAdd.name} telah ditambahkan ke grup.`;
    setChats(prevChats => {
      const currentChatToUpdate = prevChats.find(c => c.id === chatIdToAddTo);
      if (!currentChatToUpdate) return prevChats; // Should not happen

      const updatedParticipants = [...currentChatToUpdate.participants, userObjectToAdd];
      const updatedLastReadBy = { ...(currentChatToUpdate.lastReadBy || {}), [userObjectToAdd.id]: 0 }; // New user hasn't read anything
      const updatedClearedTimestamp = { ...(currentChatToUpdate.clearedTimestamp || {}), [userObjectToAdd.id]: 0 }; // New user has no cleared history


      return prevChats.map(c =>
        c.id === chatIdToAddTo
          ? {
              ...c,
              participants: updatedParticipants,
              lastReadBy: updatedLastReadBy,
              clearedTimestamp: updatedClearedTimestamp,
              lastMessage: systemMessage, // Update last message for the group
              lastMessageTimestamp: now,  // Update group's last message timestamp
            }
          : c
      ).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
    });
    toast({ title: "Pengguna Ditambahkan", description: `${userObjectToAdd.name} telah ditambahkan ke grup.` });
    setChatIdToAddTo(null); // Reset after adding
  }, [currentUser, chatIdToAddTo, setChats, toast, chats]);


  const handleTriggerDeleteGroup = useCallback((chatId: string) => {
    setGroupToDeleteId(chatId);
    setIsDeleteGroupConfirmOpen(true);
  }, []);

  const handleConfirmDeleteGroup = useCallback(() => {
    if (!groupToDeleteId) return;

    const groupName = chats.find(chat => chat.id === groupToDeleteId)?.name || "Grup";
    setChats(prevChats => prevChats.filter(chat => chat.id !== groupToDeleteId));
    setAllMessages(prevAllMessages => {
      const newAllMessages = { ...prevAllMessages };
      delete newAllMessages[groupToDeleteId];
      return newAllMessages;
    });

    if (selectedChat?.id === groupToDeleteId) {
      setSelectedChat(null);
    }
    toast({ title: "Grup Dihapus", description: `Grup "${groupName}" telah dihapus secara permanen.`, variant: "destructive" });
    setIsDeleteGroupConfirmOpen(false);
    setGroupToDeleteId(null);
  }, [groupToDeleteId, chats, selectedChat?.id, setChats, setAllMessages, toast]);

  const handleCancelDeleteGroup = useCallback(() => {
    setIsDeleteGroupConfirmOpen(false);
    setGroupToDeleteId(null);
  }, []);

  const handleRemoveParticipantFromGroup = useCallback((chatId: string, participantIdToRemove: string) => {
    if (!currentUser) return;

    setChats(prevChats => {
      const chatToUpdate = prevChats.find(c => c.id === chatId);
      if (!chatToUpdate || chatToUpdate.type !== 'group' || chatToUpdate.createdByUserId !== currentUser.id) {
        toast({ title: "Aksi Gagal", description: "Anda tidak memiliki izin untuk mengeluarkan pengguna dari grup ini.", variant: "destructive" });
        return prevChats;
      }
      if (participantIdToRemove === currentUser.id) {
        toast({ title: "Aksi Gagal", description: "Anda tidak dapat mengeluarkan diri sendiri dari grup.", variant: "destructive" });
        return prevChats;
      }

      const participantToRemove = chatToUpdate.participants.find(p => p.id === participantIdToRemove);
      if (!participantToRemove) {
        toast({ title: "Error", description: "Pengguna tidak ditemukan di grup.", variant: "destructive" });
        return prevChats;
      }

      const updatedParticipants = chatToUpdate.participants.filter(p => p.id !== participantIdToRemove);

      const updatedLastReadBy = { ...chatToUpdate.lastReadBy };
      delete updatedLastReadBy[participantIdToRemove];

      const updatedClearedTimestamp = { ...chatToUpdate.clearedTimestamp };
      delete updatedClearedTimestamp[participantIdToRemove];

      const now = Date.now();
      const removalMessage = `${participantToRemove.name} telah dikeluarkan dari grup.`;

      toast({ title: "Pengguna Dikeluarkan", description: removalMessage });

      const updatedChat = {
        ...chatToUpdate,
        participants: updatedParticipants,
        lastReadBy: updatedLastReadBy,
        clearedTimestamp: updatedClearedTimestamp,
        lastMessage: removalMessage,
        lastMessageTimestamp: now,
      };

      if (selectedChat?.id === chatId) {
        setSelectedChat(updatedChat); // Update selectedChat if it's the one being modified
      }

      return prevChats.map(c => c.id === chatId ? updatedChat : c)
                      .sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
    });
  }, [currentUser, setChats, toast, selectedChat]);

  const handleStartGroupWithUser = useCallback((userToInclude: User) => {
    if (!currentUser) return;
    setGroupDialogInitialMemberName(userToInclude.name);
    setIsNewGroupChatDialogOpen(true);
  }, [currentUser]);

  const handleBlockUser = useCallback((chatId: string) => {
    if (!currentUser) return;
    const chatToBlock = chats.find(c => c.id === chatId);
    if (!chatToBlock || chatToBlock.type !== 'direct') {
        toast({ title: "Error", description: "Chat tidak ditemukan atau bukan direct chat.", variant: "destructive"});
        return;
    }
    const otherParticipant = chatToBlock.participants.find(p => p.id !== currentUser.id);
    const otherParticipantName = otherParticipant?.name || "Pengguna";

    setChats(prev => prev.map(c => {
        if (c.id === chatId) {
            return {
                ...c,
                blockedByUser: currentUser.id,
                lastMessage: `Anda memblokir ${otherParticipantName}.`,
                lastMessageTimestamp: Date.now()
            };
        }
        return c;
    }).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0)));

    if (selectedChat?.id === chatId) {
        setSelectedChat(prev => prev ? {...prev, blockedByUser: currentUser.id, lastMessage: `Anda memblokir ${otherParticipantName}.`, lastMessageTimestamp: Date.now()} : null);
    }
    toast({ title: "Pengguna Diblokir", description: `Anda telah memblokir ${otherParticipantName}.` });
  }, [currentUser, chats, selectedChat, setChats, toast]);

  const handleUnblockUser = useCallback((chatId: string) => {
    if (!currentUser) return;
     const chatToUnblock = chats.find(c => c.id === chatId);
    if (!chatToUnblock || chatToUnblock.type !== 'direct') {
        toast({ title: "Error", description: "Chat tidak ditemukan atau bukan direct chat.", variant: "destructive"});
        return;
    }
    const otherParticipant = chatToUnblock.participants.find(p => p.id !== currentUser.id);
    const otherParticipantName = otherParticipant?.name || "Pengguna";

    setChats(prev => prev.map(c => {
        if (c.id === chatId) {
            return {
                ...c,
                blockedByUser: undefined,
                lastMessage: `Anda membuka blokir ${otherParticipantName}.`,
                lastMessageTimestamp: Date.now()
            };
        }
        return c;
    }).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0)));

    if (selectedChat?.id === chatId) {
        setSelectedChat(prev => prev ? {...prev, blockedByUser: undefined, lastMessage: `Anda membuka blokir ${otherParticipantName}.`, lastMessageTimestamp: Date.now()} : null);
    }
    toast({ title: "Blokir Dibuka", description: `Anda telah membuka blokir ${otherParticipantName}.` });
  }, [currentUser, chats, selectedChat, setChats, toast]);


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
                <div className="flex items-center gap-2 shrink-0 mr-2">
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
                    <div className="md:hidden">
                      <SidebarTrigger />
                    </div>
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
                  Pengaturan & Akun
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={() => setIsAboutDialogOpen(true)}>
                    <InfoIcon className="mr-2 h-4 w-4" />
                    <span>Tentang Aplikasi</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleLogout(false)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar (Simpan Data)</span>
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
             {selectedChat && (
                <Button variant="ghost" size="icon" className="mr-1 shrink-0" onClick={handleGoBack}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Kembali</span>
                </Button>
             )}
             {selectedChat && <span className="ml-2 font-semibold truncate max-w-[calc(100vw-120px)]">
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
              onGoBack={handleGoBack}
              onDeleteAllMessagesInChat={handleDeleteAllMessagesInChat}
              onTriggerAddUserToGroup={() => handleOpenAddUserToGroupDialog(selectedChat.id)}
              onTriggerDeleteGroup={handleTriggerDeleteGroup}
              onRemoveParticipant={handleRemoveParticipantFromGroup}
              onStartGroupWithUser={handleStartGroupWithUser}
              onBlockUser={handleBlockUser}
              onUnblockUser={handleUnblockUser}
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
        onOpenChange={(isOpen) => {
            setIsNewGroupChatDialogOpen(isOpen);
            if (!isOpen) { // Reset initial member name when dialog is closed
                setGroupDialogInitialMemberName(null);
            }
        }}
        onCreateChat={handleCreateGroupChat}
        currentUserObj={currentUser}
        chats={chats}
        initialMemberName={groupDialogInitialMemberName}
      />
      <AddUserToGroupDialog
        isOpen={isAddUserToGroupDialogOpen}
        onOpenChange={setIsAddUserToGroupDialogOpen}
        onAddUser={handleAddNewUserToGroup}
        currentUserObj={currentUser}
        chats={chats}
      />
       <AlertDialog open={isDeleteGroupConfirmOpen} onOpenChange={setIsDeleteGroupConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus grup secara permanen. Semua pesan dalam grup ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDeleteGroup}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus Grup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isAboutDialogOpen} onOpenChange={setIsAboutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tentang SimplicChat</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground pt-2">
              SimplicChat adalah aplikasi chatting sederhana yang dibuat untuk Project IDX.
              Fitur-fitur meliputi pesan langsung, grup chat, dan penyimpanan lokal.
              Dibangun dengan Next.js, React, ShadCN UI, Tailwind CSS, dan Genkit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center justify-center mt-4">
            <AppLogo className="h-10 w-10 text-primary" />
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsAboutDialogOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </SidebarProvider>
  );
}

    