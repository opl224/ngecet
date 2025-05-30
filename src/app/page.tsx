
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { User, Chat, Message, RegisteredUser } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile
import useLocalStorage from "@/hooks/use-local-storage"; // Import the actual useLocalStorage
import { AppLogo } from "@/components/core/AppLogo";
import { UserProfileForm } from "@/components/core/UserProfileForm";
import { ChatList } from "@/components/chat/ChatList";
import { ChatView } from "@/components/chat/ChatView";
import { WelcomeMessage } from "@/components/chat/WelcomeMessage";
import { NewDirectChatDialog } from "@/components/chat/NewDirectChatDialog";
import { NewGroupChatDialog } from "@/components/chat/NewGroupChatDialog";
import { AddUserToGroupDialog } from "@/components/chat/AddUserToGroupDialog";
import { AuthPage } from "@/components/auth/AuthPage";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { LogOut, Trash2, Settings, InfoIcon, Palette, Sun, Moon, Laptop } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from '@/components/core/Providers';


const LS_USER_KEY = "ngecet_user";
const LS_CHATS_KEY = "ngecet_chats";
const LS_MESSAGES_PREFIX = "ngecet_messages_";
const LS_REGISTERED_USERS_KEY = "ngecet_registered_users";

export default function ChatPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [currentUser, setCurrentUser] = useLocalStorage<User | null>(LS_USER_KEY, null);

  const initialRegisteredUsersValue = useMemo(() => [], []);
  const [registeredUsers, setRegisteredUsers] = useLocalStorage<RegisteredUser[]>(LS_REGISTERED_USERS_KEY, initialRegisteredUsersValue);

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

  const [isDeleteAllMessagesConfirmOpen, setIsDeleteAllMessagesConfirmOpen] = useState(false);
  const [chatIdToDeleteAllMessagesFrom, setChatIdToDeleteAllMessagesFrom] = useState<string | null>(null);


  const [isClient, setIsClient] = useState(false);
  const isMobileView = useIsMobile(); // Use the dedicated hook for mobile view detection

  useEffect(() => {
    setIsClient(true);
    // The useIsMobile hook already handles resize events, so the manual listener can be removed.
  }, []);

  const handleRegister = useCallback((email: string, username: string, password_mock: string): boolean => {
    if (registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      toast({ title: "Registrasi Gagal", description: "Username sudah ada." });
      return false;
    }

    const userId = username.toLowerCase().replace(/\s+/g, "_") || `user_${Date.now()}`;
    const nameInitial = username.substring(0,1).toUpperCase() || 'U';
    const newUserProfile: User = {
      id: userId,
      name: username,
      avatarUrl: `https://placehold.co/100x100.png?text=${nameInitial}`,
      status: "Online"
    };
    const newRegisteredUser: RegisteredUser = {
      username,
      password: password_mock,
      profile: newUserProfile,
      email: email,
    };
    setRegisteredUsers(prev => [...prev, newRegisteredUser]);
    setCurrentUser(newUserProfile);
    toast({ title: "Registrasi Berhasil!" });
    return true;
  }, [registeredUsers, setRegisteredUsers, setCurrentUser, toast]);

  const handleLogin = useCallback((username: string, password_mock: string): boolean => {
    const foundUser = registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password_mock);
    if (foundUser) {
      setCurrentUser(foundUser.profile);
      toast({ title: "Login Berhasil!" });
      return true;
    }
    toast({ title: "Login Gagal", description: "Username atau password salah." });
    return false;
  }, [registeredUsers, setCurrentUser, toast]);


  const handleSaveProfile = useCallback((name: string) => {
    if (currentUser) {
        const newNameInitial = name.substring(0,1).toUpperCase() || 'U';
        const newAvatarUrl = `https://placehold.co/100x100.png?text=${newNameInitial}`;

        const updatedCurrentUser = {
            ...currentUser,
            name,
            avatarUrl: newAvatarUrl,
        };
        setCurrentUser(updatedCurrentUser);

        setRegisteredUsers(prevRegisteredUsers =>
            prevRegisteredUsers.map(ru =>
                ru.profile.id === currentUser.id
                    ? { ...ru, profile: updatedCurrentUser }
                    : ru
            )
        );

        setChats(prevChats =>
            prevChats.map(chat => {
                const updatedParticipants = chat.participants.map(p =>
                    p.id === currentUser.id ? updatedCurrentUser : p
                );

                let updatedChatName = chat.name;
                let updatedChatAvatar = chat.avatarUrl;

                if (chat.type === 'direct') {
                    const otherParticipant = updatedParticipants.find(p => p.id !== currentUser.id);
                    if (otherParticipant) {
                        if (chat.name === currentUser.name && chat.participants.some(p => p.id === currentUser.id)) {
                           updatedChatName = otherParticipant.name;
                           updatedChatAvatar = otherParticipant.avatarUrl;
                        } else if (chat.participants.some(p => p.id === currentUser.id) && chat.participants.find(p=> p.id !== currentUser.id)?.name === name){
                           // No need to change name/avatar if the other participant's name is the one being updated in their own profile.
                           // This case should ideally be handled when *that* other participant updates their profile.
                           // For direct chat, the chat.name and chat.avatarUrl should reflect the *other* user.
                           // If the current user is one of the participants, this chat.name/avatarUrl should NOT change.
                           // The participants array has been updated, that's the main thing.
                           // Re-assign to ensure it reflects the *other* user
                           updatedChatName = otherParticipant.name;
                           updatedChatAvatar = otherParticipant.avatarUrl;
                        }
                    } else {
                        if (chat.name === currentUser.name) updatedChatName = updatedCurrentUser.name;
                        if (chat.avatarUrl === currentUser.avatarUrl) updatedChatAvatar = updatedCurrentUser.avatarUrl;
                    }
                }

                return {
                    ...chat,
                    participants: updatedParticipants,
                    name: updatedChatName,
                    avatarUrl: updatedChatAvatar,
                };
            })
        );

        setAllMessages(prevAllMessages => {
            const newAllMessages = { ...prevAllMessages };
            for (const chatId in newAllMessages) {
                newAllMessages[chatId] = newAllMessages[chatId].map(msg =>
                    msg.senderId === currentUser.id
                        ? { ...msg, senderName: updatedCurrentUser.name }
                        : msg
                );
            }
            return newAllMessages;
        });

        toast({ title: "Profil Diperbarui" });
    }
  }, [currentUser, setCurrentUser, setRegisteredUsers, setChats, setAllMessages, toast]);


  const handleCreateDirectChat = useCallback((recipientUsername: string) => {
    if (!currentUser) return;

    const recipientRegisteredUser = registeredUsers.find(ru => ru.username.toLowerCase() === recipientUsername.toLowerCase());

    if (!recipientRegisteredUser) {
        toast({ title: "Error", description: `Username "${recipientUsername}" tidak ditemukan.`, variant: "destructive" });
        return;
    }
    const recipientUser = recipientRegisteredUser.profile;

    if (recipientUser.id === currentUser.id) {
      toast({ title: "Error", description: "Anda tidak bisa chat dengan diri sendiri.", variant: "destructive" });
      return;
    }

    const participantsArray: User[] = [currentUser, recipientUser].sort((a, b) => a.id.localeCompare(b.id));
    const chatId = `direct_${participantsArray.map(p=>p.id).join("_")}`;


    const existingChat = chats.find(c => c.id === chatId);
    if (existingChat) {
      setSelectedChat(existingChat);
      if (existingChat.blockedByUser && existingChat.blockedByUser === currentUser.id) {
      } else if (existingChat.blockedByUser && existingChat.blockedByUser !== currentUser.id) {
      } else if (existingChat.pendingApprovalFromUserId === currentUser.id) {
        toast({ title: "Permintaan Tertunda", description: `Anda memiliki permintaan chat dari ${recipientUser.name}. Terima atau tolak dari daftar chat.` });
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
      clearedTimestamp: {
        [currentUser.id]: 0,
        [recipientUser.id]: 0,
      },
    };
    setChats(prev => [newChat, ...prev].sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0)));
    setSelectedChat(newChat);
    toast({ title: "Permintaan Terkirim", description: `Permintaan chat telah dikirim ke ${recipientUser.name}.` });
  }, [currentUser, chats, setChats, toast, registeredUsers]);


  const handleAcceptChatRequest = useCallback((chatId: string) => {
    if (!currentUser) return;
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
          setAllMessages(prev => ({ ...prev, [chatId]: prev[chatId] || [] }));
      }
      return updatedChats;
    });
    toast({ title: "Permintaan Diterima", description: `Anda sekarang dapat mengirim pesan dengan ${acceptedChatName}.` });

  }, [currentUser, setChats, toast, setAllMessages]);

  const handleRejectChatRequest = useCallback((chatId: string) => {
    if (!currentUser) return;
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

    const invalidMemberMessages: string[] = [];
    const finalMemberUsers: User[] = [currentUser];

    for (const name of memberDisplayNames) {
        const registeredMember = registeredUsers.find(ru => ru.profile.name.toLowerCase() === name.toLowerCase() || ru.username.toLowerCase() === name.toLowerCase());
        const userObjectToAdd = registeredMember?.profile;

        if (!userObjectToAdd) {
            invalidMemberMessages.push(`Pengguna ${name} tidak ditemukan.`);
            continue;
        }

        if (userObjectToAdd.id === currentUser.id) continue;
        if (finalMemberUsers.find(u => u.id === userObjectToAdd.id)) continue;

        const potentialDirectChatIdParts = [currentUser.id, userObjectToAdd.id].sort();
        const potentialDirectChatId = `direct_${potentialDirectChatIdParts[0]}_${potentialDirectChatIdParts[1]}`;
        const existingDirectChat = chats.find(c => c.id === potentialDirectChatId);

        let reasonForInvalid = "";
        let canAdd = false;

        if (existingDirectChat) {
            if (existingDirectChat.blockedByUser === currentUser.id) {
                reasonForInvalid = `Anda telah memblokir ${userObjectToAdd.name}.`;
            } else if (existingDirectChat.blockedByUser === userObjectToAdd.id) {
                reasonForInvalid = `${userObjectToAdd.name} telah memblokir Anda.`;
            } else if (existingDirectChat.pendingApprovalFromUserId === userObjectToAdd.id) {
                reasonForInvalid = `Permintaan chat Anda kepada ${userObjectToAdd.name} masih tertunda.`;
            } else if (existingDirectChat.pendingApprovalFromUserId === currentUser.id) {
                reasonForInvalid = `Anda belum menerima permintaan chat dari ${userObjectToAdd.name}.`;
            } else if (existingDirectChat.isRejected) {
                reasonForInvalid = `Chat langsung dengan ${userObjectToAdd.name} sebelumnya ditolak.`;
            } else if (!existingDirectChat.pendingApprovalFromUserId && !existingDirectChat.isRejected && !existingDirectChat.blockedByUser) {
                canAdd = true;
            } else {
                 reasonForInvalid = `Anda tidak memiliki chat langsung yang aktif dengan ${userObjectToAdd.name}.`;
            }
        } else {
             reasonForInvalid = `Anda tidak memiliki chat langsung yang aktif dengan ${userObjectToAdd.name}. Harap mulai chat langsung dan tunggu penerimaan.`;
        }

        if(canAdd) {
            finalMemberUsers.push(userObjectToAdd);
        } else if (reasonForInvalid) {
            invalidMemberMessages.push(reasonForInvalid);
        } else {
            invalidMemberMessages.push(`Tidak dapat memvalidasi pengguna ${userObjectToAdd.name}.`);
        }
    }

    if (invalidMemberMessages.length > 0) {
        toast({
            title: "Gagal Membuat Grup",
            description: `Pengguna berikut tidak dapat ditambahkan: ${invalidMemberMessages.join("; ")}.`,
            variant: "destructive",
            duration: 7000,
        });
        return;
    }

    if (finalMemberUsers.length < 2) {
         toast({
            title: "Anggota Diperlukan",
            description: "Harap tambahkan minimal satu anggota lain yang valid.",
            variant: "destructive",
        });
        return;
    }

    const groupInitial = groupName.substring(0,1).toUpperCase() || 'G';
    const chatId = `group_${groupName.replace(/\s+/g, "_")}_${Date.now()}`;
    const createdBy = currentUser.id;

    const initialLastReadBy: Record<string, number> = {};
    const initialClearedTimestamp: Record<string, number> = {};

    finalMemberUsers.forEach(p => {
        initialLastReadBy[p.id] = p.id === currentUser.id ? Date.now() : 0;
        initialClearedTimestamp[p.id] = 0;
    });

    const newChat: Chat = {
      id: chatId,
      type: "group",
      name: groupName,
      participants: finalMemberUsers,
      lastMessage: "Grup telah dibuat.",
      lastMessageTimestamp: Date.now(),
      avatarUrl: `https://placehold.co/100x100.png?text=${groupInitial}`,
      lastReadBy: initialLastReadBy,
      clearedTimestamp: initialClearedTimestamp,
      createdByUserId: createdBy,
    };
    setChats(prev => [newChat, ...prev].sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0)));
    setSelectedChat(newChat);
    setAllMessages(prev => ({ ...prev, [chatId]: [] }));
    toast({ title: "Grup Dibuat", description: `Grup "${groupName}" telah siap.` });
  }, [currentUser, chats, setChats, setAllMessages, toast, registeredUsers]);

  const handleSelectChat = useCallback((chat: Chat) => {
    if (currentUser && chat.id) {
        if (chat.type === 'direct' && chat.blockedByUser === currentUser.id) {
            // User has blocked this person, allow selecting to show overlay
        } else if (chat.type === 'direct' && chat.blockedByUser && chat.blockedByUser !== currentUser.id) {
            // User is blocked by this person, allow selecting to show overlay
        } else if (chat.pendingApprovalFromUserId === currentUser.id) {
            // User has a pending request from this person, allow selecting
        }
        setSelectedChat(chat); // Select the chat regardless of the conditions above for overlay display

        // Only update lastReadBy if the chat is active and not blocked
        if (chat.id && chat.lastReadBy &&
            !chat.pendingApprovalFromUserId &&
            !chat.isRejected &&
            !(chat.type === 'direct' && chat.blockedByUser)) {
            setChats(prevChats =>
                prevChats.map(c =>
                    c.id === chat.id
                        ? { ...c, lastReadBy: { ...(c.lastReadBy || {}), [currentUser.id]: Date.now() } }
                        : c
                ).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0))
            );
        }
    }
    if (editingMessageDetails && editingMessageDetails.chatId !== chat.id) {
        setEditingMessageDetails(null);
    }
  }, [currentUser, setChats, editingMessageDetails]);


  const handleSelectChatMobile = useCallback((chat: Chat) => {
    handleSelectChat(chat);
  }, [handleSelectChat]);


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
      if (chat.id !== selectedChat.id && !chat.pendingApprovalFromUserId && !chat.isRejected && !(chat.type === 'direct' && chat.blockedByUser)) {
         return {
          ...chat,
          lastMessage: "Aktivitas baru di " + chat.name,
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
            if (c.blockedByUser === currentUser?.id) fallbackLastMessage = `Anda memblokir ${c.participants.find(p=>p.id !== currentUser?.id)?.name || 'pengguna ini'}.`;
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
       setEditingMessageDetails(null);
       toast({ title: "Info Pesan", description: "Konten pesan tidak berubah." });
       return;
    }

    const editedTimestamp = Date.now();
    let latestMessageDetailsForChat: { content: string; timestamp: number } | null = null;

    setAllMessages(prevAllMessages => {
      if (!editingMessageDetails) return prevAllMessages;

      const chatMessages = (prevAllMessages[editingMessageDetails.chatId] || []).map(msg =>
        msg.id === messageId ? { ...msg, content: newContent, isEdited: true, timestamp: editedTimestamp } : msg
      );
      const sortedChatMessages = [...chatMessages].sort((a, b) => a.timestamp - b.timestamp);
      if (sortedChatMessages.length > 0) {
        const lastMsg = sortedChatMessages[sortedChatMessages.length - 1];
        latestMessageDetailsForChat = { content: lastMsg.content, timestamp: lastMsg.timestamp };
      }
      return { ...prevAllMessages, [editingMessageDetails.chatId]: sortedChatMessages };
    });

    setEditingMessageDetails(null);
    toast({ title: "Pesan Diperbarui" });

    setChats(prevChats => {
      if (!editingMessageDetails) return prevChats;
      const updatedChats = prevChats.map(chat => {
        if (chat.id === editingMessageDetails.chatId) {
          if (latestMessageDetailsForChat) {
            return {
              ...chat,
              lastMessage: latestMessageDetailsForChat.content,
              lastMessageTimestamp: latestMessageDetailsForChat.timestamp
            };
          } else {
             let fallbackMsg = "Belum ada pesan";
              if (chat.type === 'direct') {
                if (chat.blockedByUser === currentUser?.id) fallbackMsg = `Anda memblokir ${chat.participants.find(p=>p.id !== currentUser?.id)?.name || 'pengguna ini'}.`;
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
      return updatedChats.sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
    });
  }, [currentUser, editingMessageDetails, setAllMessages, setChats, toast]);

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
  }, [setChats, setAllMessages, selectedChat?.id]);

  const handleLogout = (clearData: boolean) => {
    setCurrentUser(null);
    setSelectedChat(null);
    setEditingMessageDetails(null);

    if (clearData) {
      setChats([]);
      setAllMessages({});
      setRegisteredUsers([]);
      if (typeof window !== "undefined") {
        Object.keys(window.localStorage).forEach(key => {
          if (key.startsWith("ngecet_")) {
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

  const handleTriggerDeleteAllMessages = useCallback((chatId: string) => {
    setChatIdToDeleteAllMessagesFrom(chatId);
    setIsDeleteAllMessagesConfirmOpen(true);
  }, []);

  const handleDeleteAllMessagesInChat = useCallback(() => {
    if (!currentUser || !chatIdToDeleteAllMessagesFrom) return;
    const now = Date.now();
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatIdToDeleteAllMessagesFrom) {
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
    setIsDeleteAllMessagesConfirmOpen(false);
    setChatIdToDeleteAllMessagesFrom(null);
    toast({ title: "Pesan Dihapus", description: "Semua pesan dalam chat ini telah dihapus dari tampilan Anda."});
  }, [currentUser, setChats, toast, chatIdToDeleteAllMessagesFrom]);

  const handleCancelDeleteAllMessages = useCallback(() => {
    setIsDeleteAllMessagesConfirmOpen(false);
    setChatIdToDeleteAllMessagesFrom(null);
  }, []);

  const handleOpenAddUserToGroupDialog = useCallback((chatId: string) => {
    setChatIdToAddTo(chatId);
    setIsAddUserToGroupDialogOpen(true);
  }, []);

  const handleAddNewUserToGroup = useCallback((userName: string) => {
    if (!currentUser || !chatIdToAddTo) {
        toast({ title: "Gagal Menambahkan", description: "Informasi tidak lengkap.", variant: "destructive" });
        return;
    }

    const chatToUpdate = chats.find(c => c.id === chatIdToAddTo);
    if (!chatToUpdate || chatToUpdate.type !== 'group') {
        toast({ title: "Error", description: "Grup tidak ditemukan atau chat bukan grup.", variant: "destructive" });
        return;
    }

    const registeredMember = registeredUsers.find(ru => ru.profile.name.toLowerCase() === userName.toLowerCase() || ru.username.toLowerCase() === userName.toLowerCase());
    const userObjectToAdd = registeredMember?.profile;

    if (!userObjectToAdd) {
        toast({ title: "Penambahan Gagal", description: `Pengguna ${userName} tidak ditemukan.`, variant: "destructive" });
        return;
    }

    if (chatToUpdate.participants.find(p => p.id === userObjectToAdd.id)) {
        toast({ title: "Info", description: `${userObjectToAdd.name} sudah menjadi anggota grup.`, variant: "default" });
        return;
    }

    const potentialDirectChatIdParts = [currentUser.id, userObjectToAdd.id].sort();
    const potentialDirectChatId = `direct_${potentialDirectChatIdParts[0]}_${potentialDirectChatIdParts[1]}`;
    const existingDirectChat = chats.find(c => c.id === potentialDirectChatId);

    let reasonForInvalid = "";

    if (existingDirectChat) {
        if (existingDirectChat.blockedByUser === currentUser.id) {
            reasonForInvalid = `Anda telah memblokir ${userObjectToAdd.name}.`;
        } else if (existingDirectChat.blockedByUser === userObjectToAdd.id) {
            reasonForInvalid = `${userObjectToAdd.name} telah memblokir Anda.`;
        } else if (existingDirectChat.pendingApprovalFromUserId === userObjectToAdd.id) {
            reasonForInvalid = `Permintaan chat Anda kepada ${userObjectToAdd.name} masih tertunda.`;
        } else if (existingDirectChat.pendingApprovalFromUserId === currentUser.id) {
            reasonForInvalid = `Anda belum menerima permintaan chat dari ${userObjectToAdd.name}.`;
        } else if (existingDirectChat.isRejected) {
            reasonForInvalid = `Chat langsung dengan ${userObjectToAdd.name} sebelumnya ditolak.`;
        } else if (!existingDirectChat.pendingApprovalFromUserId && !existingDirectChat.isRejected && !existingDirectChat.blockedByUser) {
            // Direct chat is active and fine
        } else {
             reasonForInvalid = `Anda tidak memiliki chat langsung yang aktif dengan ${userObjectToAdd.name}.`;
        }
    } else {
         reasonForInvalid = `Anda tidak memiliki chat langsung yang aktif dengan ${userObjectToAdd.name}. Harap mulai chat langsung dan tunggu penerimaan.`;
    }

    if (reasonForInvalid) {
        toast({ title: "Penambahan Gagal", description: `Tidak dapat menambahkan ${userObjectToAdd.name}. ${reasonForInvalid}`, variant: "destructive", duration: 7000 });
        return;
    }


    const now = Date.now();
    const systemMessage = `${userObjectToAdd.name} telah ditambahkan ke grup.`;
    setChats(prevChats => {
      const currentChatToUpdate = prevChats.find(c => c.id === chatIdToAddTo);
      if (!currentChatToUpdate) return prevChats;

      const updatedParticipants = [...currentChatToUpdate.participants, userObjectToAdd];
      const updatedLastReadBy = { ...(currentChatToUpdate.lastReadBy || {}), [userObjectToAdd.id]: 0 };
      const updatedClearedTimestamp = { ...(currentChatToUpdate.clearedTimestamp || {}), [userObjectToAdd.id]: 0 };

      return prevChats.map(c =>
        c.id === chatIdToAddTo
          ? {
              ...c,
              participants: updatedParticipants,
              lastReadBy: updatedLastReadBy,
              clearedTimestamp: updatedClearedTimestamp,
              lastMessage: systemMessage,
              lastMessageTimestamp: now,
            }
          : c
      ).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
    });
    toast({ title: "Pengguna Ditambahkan", description: `${userObjectToAdd.name} telah ditambahkan ke grup.` });
    setChatIdToAddTo(null);
  }, [currentUser, chatIdToAddTo, setChats, toast, chats, registeredUsers]);


  const handleTriggerDeleteGroup = useCallback((chatId: string) => {
    setGroupToDeleteId(chatId);
    setIsDeleteGroupConfirmOpen(true);
  }, []);

  const handleConfirmDeleteGroup = useCallback(() => {
    if (!groupToDeleteId || !currentUser) return;

    const groupToDelete = chats.find(chat => chat.id === groupToDeleteId);
    if (!groupToDelete || groupToDelete.createdByUserId !== currentUser.id) {
        toast({ title: "Gagal hapus", description: "Anda tidak memiliki izin untuk menghapus grup ini.", variant: "destructive" });
        setIsDeleteGroupConfirmOpen(false);
        setGroupToDeleteId(null);
        return;
    }

    const groupName = groupToDelete.name || "Grup";
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
  }, [groupToDeleteId, chats, selectedChat?.id, setChats, setAllMessages, toast, currentUser]);

  const handleCancelDeleteGroup = useCallback(() => {
    setIsDeleteGroupConfirmOpen(false);
    setGroupToDeleteId(null);
  }, []);

  const handleRemoveParticipantFromGroup = useCallback((chatId: string, participantIdToRemove: string) => {
    if (!currentUser) return;

    let toastMessageContent: string | null = null;
    let chatToSelectAfterUpdate: Chat | null = null;

    setChats(prevChats => {
      const chatToUpdate = prevChats.find(c => c.id === chatId);
      if (!chatToUpdate || chatToUpdate.type !== 'group' || chatToUpdate.createdByUserId !== currentUser.id) {
        toast({ title: "Gagal", description: "Anda bukan admin atau chat tidak ditemukan.", variant: "destructive"});
        return prevChats;
      }
      if (participantIdToRemove === currentUser.id) {
        toast({ title: "Info", description: "Admin tidak dapat mengeluarkan diri sendiri.", variant: "default"});
        return prevChats;
      }

      const participantToRemove = chatToUpdate.participants.find(p => p.id === participantIdToRemove);
      if (!participantToRemove) {
        toast({ title: "Gagal", description: "Partisipan tidak ditemukan.", variant: "destructive"});
        return prevChats;
      }

      const updatedParticipants = chatToUpdate.participants.filter(p => p.id !== participantIdToRemove);
      const updatedLastReadBy = { ...chatToUpdate.lastReadBy };
      delete updatedLastReadBy[participantIdToRemove];
      const updatedClearedTimestamp = { ...chatToUpdate.clearedTimestamp };
      delete updatedClearedTimestamp[participantIdToRemove];
      const now = Date.now();
      const removalMessage = `${participantToRemove.name} telah dikeluarkan dari grup.`;

      toastMessageContent = removalMessage;

      const updatedChat = {
        ...chatToUpdate,
        participants: updatedParticipants,
        lastReadBy: updatedLastReadBy,
        clearedTimestamp: updatedClearedTimestamp,
        lastMessage: removalMessage,
        lastMessageTimestamp: now,
      };

      if (selectedChat?.id === chatId) {
        chatToSelectAfterUpdate = updatedChat;
      }

      return prevChats.map(c => c.id === chatId ? updatedChat : c)
                      .sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
    });

    if (toastMessageContent) {
      toast({ title: "Pengguna Dikeluarkan", description: toastMessageContent });
    }
    if (chatToSelectAfterUpdate) {
      setSelectedChat(chatToSelectAfterUpdate);
    }

  }, [currentUser, setChats, toast, selectedChat]);

  const handleLeaveGroup = useCallback((chatId: string) => {
    if (!currentUser) return;

    let chatBeingLeft: Chat | undefined;
    let isGroupDeleted = false;
    let groupNameForToast = "Grup";

    setChats(prevChats => {
        chatBeingLeft = prevChats.find(c => c.id === chatId);
        if (!chatBeingLeft || chatBeingLeft.type !== 'group') {
            toast({ title: "Error", description: "Grup tidak ditemukan atau bukan grup.", variant: "destructive" });
            return prevChats;
        }
        groupNameForToast = chatBeingLeft.name || "Grup";

        const updatedParticipants = chatBeingLeft.participants.filter(p => p.id !== currentUser.id);

        if (updatedParticipants.length === 0) {
            isGroupDeleted = true;
            return prevChats.filter(c => c.id !== chatId);
        }

        const updatedLastReadBy = { ...chatBeingLeft.lastReadBy };
        delete updatedLastReadBy[currentUser.id];
        const updatedClearedTimestamp = { ...chatBeingLeft.clearedTimestamp };
        delete updatedClearedTimestamp[currentUser.id];
        const now = Date.now();
        const leaveMessage = `${currentUser.name} telah keluar dari grup.`;

        return prevChats.map(c =>
            c.id === chatId
                ? {
                    ...c,
                    participants: updatedParticipants,
                    lastReadBy: updatedLastReadBy,
                    clearedTimestamp: updatedClearedTimestamp,
                    lastMessage: leaveMessage,
                    lastMessageTimestamp: now,
                  }
                : c
        ).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
    });

    if (isGroupDeleted) {
        setAllMessages(prevAllMessages => {
            const newAllMessages = { ...prevAllMessages };
            delete newAllMessages[chatId];
            return newAllMessages;
        });
        toast({ title: "Grup ditinggalkan & dihapus", description: `Anda keluar dari grup "${groupNameForToast}", dan grup tersebut telah dihapus karena kosong.` });
    } else if (chatBeingLeft) {
        toast({ title: "Keluar Grup Berhasil", description: `Anda telah keluar dari grup "${groupNameForToast}".` });
    }

    if (selectedChat?.id === chatId) {
        setSelectedChat(null);
    }
}, [currentUser, selectedChat?.id, setChats, setAllMessages, toast]);


  const handleStartGroupWithUser = useCallback((userToInclude: User) => {
    if (!currentUser) return;
    setGroupDialogInitialMemberName(userToInclude.name);
    setIsNewGroupChatDialogOpen(true);
  }, [currentUser]);

  const handleBlockUser = useCallback((chatId: string) => {
    if (!currentUser) return;
    const chatToBlock = chats.find(c => c.id === chatId);
    if (!chatToBlock || chatToBlock.type !== 'direct') {
        toast({ title: "Error", description: "Hanya chat langsung yang bisa diblokir.", variant: "destructive" });
        return;
    }
    const otherParticipant = chatToBlock.participants.find(p => p.id !== currentUser.id);
    const otherParticipantName = otherParticipant?.name || "Pengguna";
    let updatedChatForSelection: Chat | null = null;

    setChats(prev => {
        const newChats = prev.map(c => {
            if (c.id === chatId) {
                const updatedVersion = {
                    ...c,
                    blockedByUser: currentUser.id,
                    lastMessage: `Anda memblokir ${otherParticipantName}.`,
                    lastMessageTimestamp: Date.now()
                };
                if(selectedChat?.id === chatId) {
                    updatedChatForSelection = updatedVersion;
                }
                return updatedVersion;
            }
            return c;
        }).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
        return newChats;
    });

    if (updatedChatForSelection) {
        setSelectedChat(updatedChatForSelection);
    }
    toast({ title: "Pengguna Diblokir", description: `Anda telah memblokir ${otherParticipantName}.` });
  }, [currentUser, chats, selectedChat, setChats, toast]);

  const handleUnblockUser = useCallback((chatId: string) => {
    if (!currentUser) return;
     const chatToUnblock = chats.find(c => c.id === chatId);
    if (!chatToUnblock || chatToUnblock.type !== 'direct') {
        toast({ title: "Error", description: "Hanya chat langsung yang bisa dibuka blokirnya.", variant: "destructive" });
        return;
    }
    const otherParticipant = chatToUnblock.participants.find(p => p.id !== currentUser.id);
    const otherParticipantName = otherParticipant?.name || "Pengguna";
    let updatedChatForSelection: Chat | null = null;

    setChats(prev => {
        const newChats = prev.map(c => {
            if (c.id === chatId) {
                 const updatedVersion = {
                    ...c,
                    blockedByUser: undefined,
                    lastMessage: `Anda membuka blokir ${otherParticipantName}.`,
                    lastMessageTimestamp: Date.now()
                };
                if(selectedChat?.id === chatId) {
                    updatedChatForSelection = updatedVersion;
                }
                return updatedVersion;
            }
            return c;
        }).sort((a, b) => (b.lastMessageTimestamp || b.requestTimestamp || 0) - (a.lastMessageTimestamp || a.requestTimestamp || 0));
        return newChats;
    });

    if (updatedChatForSelection) {
        setSelectedChat(updatedChatForSelection);
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
         <AuthPage onLogin={handleLogin} onRegister={handleRegister} />
      </div>
    );
  }

  const currentRegisteredUserForProfile = currentUser ? registeredUsers.find(ru => ru.profile.id === currentUser.id) : null;
  const currentUserEmailForProfile = currentRegisteredUserForProfile?.email;


  if (isMobileView) {
    if (selectedChat) {
      return (
        <SidebarProvider>
            <div className="h-screen w-full flex flex-col">
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
                onTriggerDeleteAllMessages={handleTriggerDeleteAllMessages}
                onTriggerAddUserToGroup={() => handleOpenAddUserToGroupDialog(selectedChat.id)}
                onTriggerDeleteGroup={handleTriggerDeleteGroup}
                onRemoveParticipant={handleRemoveParticipantFromGroup}
                onStartGroupWithUser={handleStartGroupWithUser}
                onBlockUser={handleBlockUser}
                onUnblockUser={handleUnblockUser}
                onLeaveGroup={handleLeaveGroup}
                isMobileView={isMobileView}
            />
           <NewDirectChatDialog
              isOpen={isNewDirectChatDialogOpen}
              onOpenChange={setIsNewDirectChatDialogOpen}
              onCreateChat={handleCreateDirectChat}
              currentUserId={currentUser?.id}
              registeredUsers={registeredUsers}
            />
            <NewGroupChatDialog
              isOpen={isNewGroupChatDialogOpen}
              onOpenChange={(isOpen) => {
                  setIsNewGroupChatDialogOpen(isOpen);
                  if (!isOpen) {
                      setGroupDialogInitialMemberName(null);
                  }
              }}
              onCreateChat={handleCreateGroupChat}
              currentUserObj={currentUser}
              initialMemberName={groupDialogInitialMemberName}
              chats={chats}
            />
            <AddUserToGroupDialog
              isOpen={isAddUserToGroupDialogOpen}
              onOpenChange={setIsAddUserToGroupDialogOpen}
              onAddUser={handleAddNewUserToGroup}
              currentUserObj={currentUser}
              chats={chats}
              chatIdToAddTo={chatIdToAddTo}
              registeredUsers={registeredUsers}
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
                    Hapus grup
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
             <AlertDialog open={isAboutDialogOpen} onOpenChange={setIsAboutDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tentang Ngecet</AlertDialogTitle>
                     <AlertDialogDescription className="text-sm text-muted-foreground pt-4 pb-2">
                      Ngecet adalah aplikasi chatting sederhana yang dibuat untuk Project IDX.
                      Fitur-fitur meliputi pesan langsung, grup chat, dan penyimpanan lokal.
                    </AlertDialogDescription>
                     <AlertDialogDescription className="text-sm text-muted-foreground pt-0 pb-6">
                      Tech: Next.js, React, ShadCN UI, Tailwind CSS dan Genkit.
                    </AlertDialogDescription>
                    <AlertDialogDescription className="text-sm text-muted-foreground font-semibold pt-4 pb-6">
                      Jika ada bug atau ui error, mon map masih tahap pengembangan!
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex items-center justify-center mt-4">
                    <AppLogo className="h-10 w-10" />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setIsAboutDialogOpen(false)}>OK</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={isDeleteAllMessagesConfirmOpen} onOpenChange={setIsDeleteAllMessagesConfirmOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus semua pesan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin menghapus semua pesan dalam chat ini? Tindakan ini hanya akan menghapus pesan dari tampilan Anda dan tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancelDeleteAllMessages}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllMessagesInChat}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </div>
        </SidebarProvider>
      );
    } else {
      return (
        <SidebarProvider defaultOpen>
          <div className="h-screen w-full flex flex-col bg-sidebar text-sidebar-foreground">
            <SidebarHeader className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2 shrink-0 mr-2">
                  <AppLogo className="h-7 w-7" />
                  <h1 className="text-xl font-semibold text-sidebar-primary-foreground dark:text-white">Ngecet</h1>
                </div>
                <div className="flex items-center gap-2">
                    <UserProfileForm
                        currentUser={currentUser}
                        onSaveProfile={handleSaveProfile}
                        displayMode="compact"
                        userEmail={currentUserEmailForProfile}
                    />
                    <div className="md:hidden">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
                            <Palette className="h-5 w-5" />
                            <span className="sr-only">Pilih Tema</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={4}>
                            <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Terang</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4" />
                            <span>Gelap</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}>
                            <Laptop className="mr-2 h-4 w-4" />
                            <span>Sistem</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-0 flex-1">
              <ChatList
                chats={chats}
                currentUser={currentUser}
                allMessages={allMessages}
                onSelectChat={handleSelectChatMobile}
                selectedChatId={selectedChat?.id}
                onNewDirectChat={() => setIsNewDirectChatDialogOpen(true)}
                onNewGroupChat={() => {
                  setGroupDialogInitialMemberName(null);
                  setIsNewGroupChatDialogOpen(true);
                }}
                onAcceptChat={handleAcceptChatRequest}
                onRejectChat={handleRejectChatRequest}
                onDeleteChatPermanently={handleDeleteChatPermanently}
                onUnblockUser={handleUnblockUser}
                isMobileView={isMobileView}
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
                <DropdownMenuContent className="w-56" align="end" sideOffset={8} side={isMobileView ? "top" : "right"}>
                  <DropdownMenuItem onClick={() => setIsAboutDialogOpen(true)}>
                    <InfoIcon className="mr-2 h-4 w-4" />
                    <span>Tentang aplikasi</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="hidden md:block">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Palette className="mr-2 h-4 w-4" />
                        <span>Tema</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent sideOffset={isMobileView ? -5 : 8} align={isMobileView ? "center" : "start"}>
                          <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Terang</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4" />
                            <span>Gelap</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTheme("system")}>
                            <Laptop className="mr-2 h-4 w-4" />
                            <span>Sistem</span>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                  </div>
                  <DropdownMenuItem onClick={() => handleLogout(false)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar (Simpan Data)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLogout(true)} className="text-destructive hover:!text-destructive focus:!text-destructive focus:!bg-destructive/10 hover:!bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Keluar & Hapus Data</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
            <NewDirectChatDialog
                isOpen={isNewDirectChatDialogOpen}
                onOpenChange={setIsNewDirectChatDialogOpen}
                onCreateChat={handleCreateDirectChat}
                currentUserId={currentUser?.id}
                registeredUsers={registeredUsers}
              />
              <NewGroupChatDialog
                isOpen={isNewGroupChatDialogOpen}
                onOpenChange={(isOpen) => {
                    setIsNewGroupChatDialogOpen(isOpen);
                    if (!isOpen) {
                        setGroupDialogInitialMemberName(null);
                    }
                }}
                onCreateChat={handleCreateGroupChat}
                currentUserObj={currentUser}
                initialMemberName={groupDialogInitialMemberName}
                chats={chats}
              />
              <AlertDialog open={isAboutDialogOpen} onOpenChange={setIsAboutDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tentang Ngecet</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm text-muted-foreground pt-4 pb-2">
                        Ngecet adalah aplikasi chatting sederhana yang dibuat untuk Project IDX.
                        Fitur-fitur meliputi pesan langsung, grup chat, dan penyimpanan lokal.
                      </AlertDialogDescription>
                      <AlertDialogDescription className="text-sm text-muted-foreground pt-0 pb-6">
                        Tech: Next.js, React, ShadCN UI, Tailwind CSS dan Genkit.
                      </AlertDialogDescription>
                      <AlertDialogDescription className="text-sm text-muted-foreground font-semibold pt-4 pb-6">
                        Jika ada bug atau ui error, mon map masih tahap pengembangan!
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex items-center justify-center mt-4">
                      <AppLogo className="h-10 w-10" />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogAction onClick={() => setIsAboutDialogOpen(false)}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          </div>
        </SidebarProvider>
      );
    }
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r flex flex-col" collapsible="none" variant="sidebar">
          <SidebarHeader className="p-0">
             <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2 shrink-0 mr-2">
                    <AppLogo className="h-7 w-7" />
                    <h1 className="text-xl font-semibold text-sidebar-primary-foreground dark:text-white">Ngecet</h1>
                </div>
                <div className="flex items-center gap-2">
                    <UserProfileForm
                        currentUser={currentUser}
                        onSaveProfile={handleSaveProfile}
                        displayMode="compact"
                        userEmail={currentUserEmailForProfile}
                    />
                    <div className="hidden md:block">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
                                    <Palette className="h-5 w-5" />
                                    <span className="sr-only">Pilih Tema</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={4}>
                                <DropdownMenuItem onClick={() => setTheme("light")}>
                                    <Sun className="mr-2 h-4 w-4" />
                                    <span>Terang</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("dark")}>
                                    <Moon className="mr-2 h-4 w-4" />
                                    <span>Gelap</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("system")}>
                                    <Laptop className="mr-2 h-4 w-4" />
                                    <span>Sistem</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                     <div className="md:hidden">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
                            <Palette className="h-5 w-5" />
                            <span className="sr-only">Pilih Tema</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={4}>
                            <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Terang</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4" />
                            <span>Gelap</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}>
                            <Laptop className="mr-2 h-4 w-4" />
                            <span>Sistem</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
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
              onNewGroupChat={() => {
                setGroupDialogInitialMemberName(null);
                setIsNewGroupChatDialogOpen(true);
              }}
              onAcceptChat={handleAcceptChatRequest}
              onRejectChat={handleRejectChatRequest}
              onDeleteChatPermanently={handleDeleteChatPermanently}
              onUnblockUser={handleUnblockUser}
              isMobileView={isMobileView}
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
              <DropdownMenuContent className="w-56" align="end" sideOffset={4} side={"right"}>
                <DropdownMenuItem onClick={() => setIsAboutDialogOpen(true)}>
                    <InfoIcon className="mr-2 h-4 w-4" />
                    <span>Tentang aplikasi</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                 <div className="hidden md:block">
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                        <Palette className="mr-2 h-4 w-4" />
                        <span>Tema</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                        <DropdownMenuSubContent sideOffset={isMobileView ? -5 : 8} align={isMobileView ? "center" : "start"}>
                            <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Terang</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4" />
                            <span>Gelap</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}>
                            <Laptop className="mr-2 h-4 w-4" />
                            <span>Sistem</span>
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                  </div>
                <DropdownMenuItem onClick={() => handleLogout(false)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar (Simpan Data)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLogout(true)} className="text-destructive hover:!text-destructive focus:!text-destructive focus:!bg-destructive/10 hover:!bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Keluar & Hapus Data</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col">
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
              onTriggerDeleteAllMessages={handleTriggerDeleteAllMessages}
              onTriggerAddUserToGroup={() => handleOpenAddUserToGroupDialog(selectedChat.id)}
              onTriggerDeleteGroup={handleTriggerDeleteGroup}
              onRemoveParticipant={handleRemoveParticipantFromGroup}
              onStartGroupWithUser={handleStartGroupWithUser}
              onBlockUser={handleBlockUser}
              onUnblockUser={handleUnblockUser}
              onLeaveGroup={handleLeaveGroup}
              isMobileView={isMobileView}
            />
          ) : (
             (isClient && !isMobileView) ? <WelcomeMessage /> : null
          )}
        </SidebarInset>
      </div>

      <NewDirectChatDialog
        isOpen={isNewDirectChatDialogOpen}
        onOpenChange={setIsNewDirectChatDialogOpen}
        onCreateChat={handleCreateDirectChat}
        currentUserId={currentUser?.id}
        registeredUsers={registeredUsers}
      />
      <NewGroupChatDialog
        isOpen={isNewGroupChatDialogOpen}
        onOpenChange={(isOpen) => {
            setIsNewGroupChatDialogOpen(isOpen);
            if (!isOpen) {
                setGroupDialogInitialMemberName(null);
            }
        }}
        onCreateChat={handleCreateGroupChat}
        currentUserObj={currentUser}
        initialMemberName={groupDialogInitialMemberName}
        chats={chats}
      />
      <AddUserToGroupDialog
        isOpen={isAddUserToGroupDialogOpen}
        onOpenChange={setIsAddUserToGroupDialogOpen}
        onAddUser={handleAddNewUserToGroup}
        currentUserObj={currentUser}
        chats={chats}
        chatIdToAddTo={chatIdToAddTo}
        registeredUsers={registeredUsers}
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
              Hapus grup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isAboutDialogOpen} onOpenChange={setIsAboutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tentang Ngecet</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground pt-4 pb-2">
              Ngecet adalah aplikasi chatting sederhana yang dibuat untuk Project IDX.
              Fitur-fitur meliputi pesan langsung, grup chat, dan penyimpanan lokal.
            </AlertDialogDescription>
             <AlertDialogDescription className="text-sm text-muted-foreground pt-0 pb-6">
              Tech: Next.js, React, ShadCN UI, Tailwind CSS dan Genkit.
            </AlertDialogDescription>
            <AlertDialogDescription className="text-sm text-muted-foreground font-semibold pt-4 pb-6">
              Jika ada bug atau ui error, mon map masih tahap pengembangan!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center justify-center mt-4">
            <AppLogo className="h-10 w-10" />
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsAboutDialogOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteAllMessagesConfirmOpen} onOpenChange={setIsDeleteAllMessagesConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus semua pesan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus semua pesan dalam chat ini? Tindakan ini hanya akan menghapus pesan dari tampilan Anda dan tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDeleteAllMessages}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllMessagesInChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </SidebarProvider>
  );
}
