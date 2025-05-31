
"use client";

import type { Chat, Message, User, ChatType } from "@/types";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { SendHorizonal, Users, User as UserIcon, X, AlertTriangle, Lock, Check, MoreVertical, LogOut, Trash2, UserPlus, UserMinus, ShieldAlert, ShieldOff, Clock, ArrowLeft, PencilLine } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";


interface ChatViewProps {
  chat: Chat;
  messages: Message[];
  currentUser: User;
  onSendMessage: (content: string, replyToMessage?: Message | null) => void;
  editingMessageDetails: Message | null;
  onSaveEditedMessage: (messageId: string, newContent: string) => void;
  onRequestEditMessage: (messageToEdit: Message) => void;
  onCancelEditMessage: () => void;
  onDeleteMessage: (messageId: string, chatId: string) => void;
  onGoBack?: () => void;
  onTriggerDeleteAllMessages: (chatId: string) => void;
  onTriggerAddUserToGroup?: () => void;
  onTriggerDeleteGroup?: (chatId: string) => void;
  onRemoveParticipant?: (chatId: string, participantIdToRemove: string) => void;
  onStartGroupWithUser?: (user: User) => void;
  onBlockUser?: (chatId: string) => void;
  onUnblockUser?: (chatId: string) => void;
  onLeaveGroup?: (chatId: string) => void;
  isMobileView: boolean;
}

export function ChatView({
  chat,
  messages,
  currentUser,
  onSendMessage,
  editingMessageDetails: propsEditingMessageDetails,
  onSaveEditedMessage,
  onRequestEditMessage,
  onCancelEditMessage,
  onDeleteMessage,
  onGoBack,
  onTriggerDeleteAllMessages,
  onTriggerAddUserToGroup,
  onTriggerDeleteGroup,
  onRemoveParticipant,
  onStartGroupWithUser,
  onBlockUser,
  onUnblockUser,
  onLeaveGroup,
  isMobileView,
}: ChatViewProps) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  
  const prevChatIdRef = useRef<string | undefined>(undefined);
  const prevEditingMessageDetailsRef = useRef<Message | null>(null);

  const { isMobile, setOpenMobile } = useSidebar();

  const handleCancelEditClick = useCallback(() => {
    onCancelEditMessage(); 
    setNewMessage("");    
    if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto';
    }
  }, [onCancelEditMessage]);

  const handleCancelReplyClick = useCallback(() => {
    setReplyingToMessage(null);
    setNewMessage(""); 
    if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto';
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (propsEditingMessageDetails) {
          handleCancelEditClick();
        } else if (replyingToMessage) {
          handleCancelReplyClick();
        } else if (onGoBack) { 
          onGoBack(); 
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [propsEditingMessageDetails, replyingToMessage, onGoBack, handleCancelEditClick, handleCancelReplyClick]);


  useEffect(() => {
    if (propsEditingMessageDetails && propsEditingMessageDetails.chatId === chat.id) {
      if (replyingToMessage) { 
         setReplyingToMessage(null); 
      }
      if (messageInputRef.current) {
        if (messageInputRef.current.value !== propsEditingMessageDetails.content) {
           messageInputRef.current.value = propsEditingMessageDetails.content;
        }
        setNewMessage(propsEditingMessageDetails.content); 
        
        messageInputRef.current.style.height = 'auto';
        const newHeight = Math.min(messageInputRef.current.scrollHeight, 120); 
        messageInputRef.current.style.height = `${newHeight}px`;
        
        setTimeout(() => {
          if (messageInputRef.current) {
            messageInputRef.current.focus();
            const len = propsEditingMessageDetails.content.length; 
            messageInputRef.current.selectionStart = len;
            messageInputRef.current.selectionEnd = len;
          }
        }, 50); 
      }
    } else if (!propsEditingMessageDetails && prevEditingMessageDetailsRef.current && prevEditingMessageDetailsRef.current.chatId === chat.id) {
      if (messageInputRef.current && !replyingToMessage ) {
          setNewMessage(""); 
          messageInputRef.current.style.height = 'auto';
      }
    }
    prevEditingMessageDetailsRef.current = propsEditingMessageDetails;
  }, [propsEditingMessageDetails, chat.id, replyingToMessage]);


  useEffect(() => {
    const chatJustSwitched = prevChatIdRef.current !== undefined && prevChatIdRef.current !== chat.id;

    if (chatJustSwitched) {
      setNewMessage(""); 
      setReplyingToMessage(null);
      if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto';
      }
      if (propsEditingMessageDetails && propsEditingMessageDetails.chatId !== chat.id) {
        onCancelEditMessage(); 
      }
    }
    
    const isChatEffectivelyActive = chat.type === 'group' || (!chat.pendingApprovalFromUserId && !chat.isRejected && !(chat.type === 'direct' && chat.blockedByUser));

    if (isChatEffectivelyActive && messageInputRef.current &&
        (chatJustSwitched && !propsEditingMessageDetails && !replyingToMessage)) { 
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 50);
    }
    prevChatIdRef.current = chat.id;
  }, [chat.id, onCancelEditMessage, propsEditingMessageDetails, replyingToMessage, chat.type, chat.pendingApprovalFromUserId, chat.isRejected, chat.blockedByUser]);


  useEffect(() => {
    if (viewportRef.current) {
      setTimeout(() => {
        if (viewportRef.current) {
          viewportRef.current.scrollTo({
            top: viewportRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100); 
    }
  }, [messages, chat.id]); 


  const displayDetails = useMemo(() => {
    let nameToDisplay: string;
    let avatarUrlToDisplay: string | undefined;
    let IconComponent: React.ElementType = UserIcon;
    let descriptionText: string;
    let statusText: string | null = null;
    let otherParticipantObject: User | undefined = undefined;

    if (chat.type === "direct") {
      otherParticipantObject = chat.participants?.find(p => p.id !== currentUser.id);
      nameToDisplay = otherParticipantObject?.name || "Direct Chat";
      avatarUrlToDisplay = otherParticipantObject?.avatarUrl || chat.avatarUrl;
      statusText = otherParticipantObject?.status || "Offline";
      descriptionText = `Status: ${statusText}`;
    } else {
      nameToDisplay = chat.name || "Unnamed Group";
      avatarUrlToDisplay = chat.avatarUrl;
      IconComponent = Users;
      descriptionText = `Grup • ${chat.participants?.length || 0} anggota`;
    }

    return {
      name: nameToDisplay,
      avatarUrl: avatarUrlToDisplay,
      Icon: IconComponent,
      description: descriptionText,
      status: statusText,
      otherParticipantObject
    };
  }, [chat, currentUser.id]);


  const isChatEffectivelyBlocked = chat.type === 'direct' &&
                                 (chat.blockedByUser === currentUser.id ||
                                  (chat.blockedByUser && chat.blockedByUser !== currentUser.id));
  const isChatActive = chat.type === 'group' || (!chat.pendingApprovalFromUserId && !chat.isRejected && !isChatEffectivelyBlocked);


  let chatOverlayMessage: { icon: React.ReactNode; title: string; text: React.ReactNode } | null = null;
  if (chat.type === 'direct') {
    const otherUserName = displayDetails.name === "Direct Chat" ? "pengguna ini" : displayDetails.name;
    if (chat.blockedByUser === currentUser.id && onUnblockUser) {
        chatOverlayMessage = {
            icon: <ShieldAlert className="w-16 h-16 text-destructive mb-4" />,
            title: "Pengguna Diblokir",
            text: (
              <div className="flex flex-col items-center">
                <p className="mb-3">{`Anda telah memblokir ${otherUserName}.`}</p>
                <Button onClick={() => onUnblockUser(chat.id)} variant="outline" size="sm" className="text-green-600 border-green-500 hover:bg-green-500/10 hover:text-green-700 focus:border-green-600 focus:bg-green-500/10">
                  <ShieldOff className="mr-2 h-4 w-4" /> Buka Blokir Pengguna
                </Button>
              </div>
            ),
        };
    } else if (chat.blockedByUser && chat.blockedByUser !== currentUser.id) {
         chatOverlayMessage = {
            icon: <Lock className="w-16 h-16 text-muted-foreground mb-4" />,
            title: "Interaksi Terbatas",
            text: `Anda tidak dapat berinteraksi dengan ${otherUserName} saat ini. Pengguna ini mungkin telah memblokir Anda atau sebaliknya.`,
        };
    } else if (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser.id) {
      chatOverlayMessage = {
        icon: <Clock className="w-16 h-16 text-muted-foreground mb-4" />,
        title: "Menunggu Persetujuan",
        text: `Permintaan pesan anda kepada ${otherUserName} sedang menunggu persetujuan.`,
      };
    } else if (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId === currentUser.id) {
       chatOverlayMessage = {
        icon: <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />,
        title: "Permintaan Tertunda",
        text: `Anda memiliki permintaan chat dari ${otherUserName}. Terima atau tolak dari daftar chat.`,
      };
    } else if (chat.isRejected) {
      const rejecterName = chat.rejectedByUserId === currentUser.id ? "Anda" : (chat.participants.find(p => p.id === chat.rejectedByUserId)?.name || otherUserName);
      const rejectedTargetName = chat.rejectedByUserId === currentUser.id ? (chat.participants.find(p=>p.id !==currentUser.id)?.name || otherUserName) : "Anda";
      chatOverlayMessage = {
        icon: <X className="w-16 h-16 text-destructive mb-4" />,
        title: "Permintaan Ditolak",
        text: `${rejecterName} telah menolak permintaan chat dengan ${rejectedTargetName}.`,
      };
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChatActive) {
      toast({ title: "Chat Tidak Aktif", description: "Anda tidak dapat mengirim pesan di chat ini.", variant: "destructive"});
      return;
    }
    if (newMessage.trim()) {
      if (propsEditingMessageDetails) {
        onSaveEditedMessage(propsEditingMessageDetails.id, newMessage.trim());
      } else {
        onSendMessage(newMessage.trim(), replyingToMessage);
        if (replyingToMessage !== null) setReplyingToMessage(null);
      }
      setNewMessage(""); 

      if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto'; 
      }
    }
  };

  const handleReplyToMessageInView = useCallback((messageToReply: Message) => {
    if(!isChatActive) return;
    if (propsEditingMessageDetails) onCancelEditMessage(); 
    setReplyingToMessage(messageToReply);
    setNewMessage(""); 
    setTimeout(() => {
        messageInputRef.current?.focus();
    }, 50);
  }, [isChatActive, propsEditingMessageDetails, onCancelEditMessage]);


  const handleTextareaInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(event.target.value);
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto'; 
      const newHeight = Math.min(messageInputRef.current.scrollHeight, 120); 
      messageInputRef.current.style.height = `${newHeight}px`;
    }
  };

  const userClearedTimestamp = chat.clearedTimestamp?.[currentUser.id] || 0;
  const displayedMessages = messages.filter(msg => msg.timestamp > userClearedTimestamp);

  const sortedParticipants = useMemo(() => {
    if (!chat.participants) return [];
    return [...chat.participants].sort((a, b) => {
      const isACurrentUser = a.id === currentUser.id;
      const isBCurrentUser = b.id === currentUser.id;
      const isACreator = a.id === chat.createdByUserId;
      const isBCreator = b.id === chat.createdByUserId;

      if (isACurrentUser && !isBCurrentUser) return -1;
      if (!isACurrentUser && isBCurrentUser) return 1;
      
      if (isACreator && !isBCreator) return -1; 
      if (!isACreator && isBCreator) return 1;

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [chat.participants, chat.createdByUserId, currentUser.id]);

  const handleMobileBackClick = () => {
    onGoBack?.();
    if (isMobile) {
      setOpenMobile(true);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-background overflow-hidden">
      <Dialog> 
        <header className="p-4 border-b flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-1 flex-1 min-w-0">
            {onGoBack && isMobileView && (
              <Button variant="ghost" size="icon" className="mr-1 shrink-0" onClick={handleMobileBackClick}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Kembali</span>
              </Button>
            )}
            <DialogTrigger asChild>
              <div className="flex items-center space-x-3 cursor-pointer group flex-1 min-w-0">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={displayDetails.avatarUrl} alt={displayDetails.name || 'Chat Avatar'} data-ai-hint={chat.type === 'group' ? 'group abstract' : 'person abstract'}/>
                  <AvatarFallback>
                    <displayDetails.Icon className="h-5 w-5 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold truncate">{displayDetails.name}</h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {chat.type === 'direct'
                      ? (isChatActive ? (displayDetails.status || (currentUser.id === chat.participants?.find(p => p.id === currentUser.id)?.id ? currentUser.status : "Offline"))
                        : (chat.blockedByUser === currentUser.id ? "Anda memblokir pengguna ini" : "Tidak aktif")
                      )
                      : displayDetails.description 
                    }
                  </p>
                </div>
              </div>
            </DialogTrigger>
          </div>

          <div className="flex items-center space-x-1">
             {isChatActive && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">Opsi Chat</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {onGoBack && !isMobileView && ( 
                            <DropdownMenuItem onClick={onGoBack} className="py-2">
                                <span>Tutup Chat</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={() => onTriggerDeleteAllMessages(chat.id)}
                            className="text-destructive hover:!text-destructive focus:!text-destructive focus:!bg-destructive/10 py-2"
                        >
                            <span>Hapus Semua Pesan</span>
                        </DropdownMenuItem>

                         {chat.type === 'group' && chat.createdByUserId === currentUser.id && onTriggerDeleteGroup && (
                             <DropdownMenuItem
                               onClick={() => onTriggerDeleteGroup(chat.id)}
                               className="text-destructive hover:!text-destructive focus:!text-destructive focus:!bg-destructive/10 py-2"
                             >
                               <span>Hapus Grup Ini</span>
                             </DropdownMenuItem>
                         )}

                         {chat.type === 'direct' && onBlockUser && onUnblockUser && (
                            <>
                                {chat.blockedByUser === currentUser.id ? (
                                    <DropdownMenuItem onClick={() => onUnblockUser && onUnblockUser(chat.id)} className="py-2">
                                        <ShieldOff className="mr-2 h-4 w-4" />
                                        <span>Buka Blokir Pengguna</span>
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => onBlockUser && onBlockUser(chat.id)} className="text-destructive hover:!text-destructive focus:!text-destructive focus:!bg-destructive/10 py-2">
                                         <ShieldAlert className="mr-2 h-4 w-4" />
                                        <span>Blokir Pengguna</span>
                                    </DropdownMenuItem>
                                )}
                            </>
                         )}
                    </DropdownMenuContent>
                </DropdownMenu>
             )}
          </div>
        </header>

        <DialogContent className="sm:max-w-md">
          <DialogHeader className="mb-4 pb-2">
            {chat.type === 'direct' && displayDetails.otherParticipantObject ? (
              <div className="flex flex-col items-center text-center space-y-3 pt-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={displayDetails.avatarUrl} alt={displayDetails.name || 'User Avatar'} data-ai-hint="person abstract large"/>
                  <AvatarFallback>
                    <displayDetails.Icon className="h-12 w-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <DialogTitle className="text-2xl">{displayDetails.name}</DialogTitle>
                <DialogDescription className="text-base">
                  <span className={cn("font-medium", isChatActive && displayDetails.status === "Online" ? "text-green-500" : "text-muted-foreground")}>
                    {isChatActive ? (displayDetails.status || "Offline")
                      : (chat.blockedByUser === currentUser.id ? "Diblokir oleh Anda" : "Tidak aktif")}
                  </span>
                </DialogDescription>
              </div>
            ) : chat.type === 'group' ? (
              <div className="text-center pt-4">
                 <Avatar className="h-24 w-24 mx-auto mb-3">
                    <AvatarImage src={displayDetails.avatarUrl} alt={displayDetails.name || 'Group Avatar'} data-ai-hint="group abstract large"/>
                    <AvatarFallback>
                        <displayDetails.Icon className="h-12 w-12 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
                <DialogTitle className="text-2xl">{displayDetails.name}</DialogTitle>
                 <DialogDescription className="text-base">
                    {displayDetails.description}
                </DialogDescription>
              </div>
            ) : null}
          </DialogHeader>
          
          {chat.type === 'direct' && onStartGroupWithUser && isChatActive && displayDetails.otherParticipantObject && (
            <>
                <DropdownMenuSeparator className="my-3"/>
                <div className="pb-2">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => onStartGroupWithUser(displayDetails.otherParticipantObject!)}
                        disabled={!!chat.blockedByUser}
                    >
                        <Users className="mr-2 h-4 w-4" />
                        Buat grup dengan {displayDetails.name}
                    </Button>
                </div>
            </>
          )}

          {chat.type === 'group' && (
            <div className="py-2 border-t">
              <div className="flex justify-between items-center mb-2 px-1 pt-2">
                  <h4 className="font-semibold text-sm">Anggota</h4>
                  {isChatActive && chat.type === 'group' && chat.createdByUserId === currentUser.id && onTriggerAddUserToGroup && (
                      <Button variant="outline" size="sm" onClick={onTriggerAddUserToGroup}>
                          <UserPlus className="mr-2 h-4 w-4" /> Tambah
                      </Button>
                  )}
              </div>
              <ScrollArea className="max-h-[250px]">
                <ul className="space-y-1 text-sm">
                  {sortedParticipants.map(participantUser => {
                    const isCurrentUserInList = participantUser.id === currentUser.id;
                    const participantName = participantUser.name || "Unknown User";
                    const isChatAdmin = participantUser.id === chat.createdByUserId;

                    return (
                      <li key={participantUser.id} className="flex items-center justify-between space-x-2 p-2 hover:bg-muted/50 rounded-md">
                         <div className="flex items-center space-x-2 min-w-0 flex-1">
                           <Avatar className="h-8 w-8">
                             <AvatarImage src={participantUser.avatarUrl} alt={participantName} data-ai-hint="person abstract small"/>
                             <AvatarFallback>{participantUser?.name?.substring(0,1).toUpperCase() || '?'}</AvatarFallback>
                           </Avatar>
                           <div className="truncate">
                              <span className="font-medium truncate">{participantName}</span>
                              {isCurrentUserInList && !isChatAdmin && <span className="text-xs text-muted-foreground"> (Anda)</span>}
                           </div>
                         </div>
                         <div className="flex items-center space-x-2 shrink-0">
                           {isChatAdmin && (
                              <span className="text-xs text-primary font-semibold">
                                {isCurrentUserInList ? "(Admin - Anda)" : "(Admin)"}
                              </span>
                           )}
                           {currentUser.id === chat.createdByUserId &&
                            participantUser.id !== currentUser.id &&
                            chat.type === 'group' &&
                            onRemoveParticipant && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={() => onRemoveParticipant && onRemoveParticipant(chat.id, participantUser.id)}
                                aria-label={`Keluarkan ${participantName}`}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                           )}
                         </div>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
                {isChatActive && chat.type === 'group' && onLeaveGroup && (
                     <div className="mt-4 pt-4 border-t">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => onLeaveGroup(chat.id)}
                            size="sm"
                        >
                            Keluar Grup
                        </Button>
                    </div>
                )}
                {isChatActive && chat.type === 'group' && chat.createdByUserId === currentUser.id && onTriggerDeleteGroup && (
                    <div className="mt-2">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => onTriggerDeleteGroup(chat.id)}
                            size="sm"
                        >
                            Hapus Grup Ini
                        </Button>
                    </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ScrollArea className="flex-1" viewportRef={viewportRef} ref={scrollAreaRef}>
        <div className="p-4">
        {chatOverlayMessage && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-10">
                {chatOverlayMessage.icon}
                <h3 className="text-xl font-semibold mb-2">{chatOverlayMessage.title}</h3>
                <div className="text-muted-foreground">{chatOverlayMessage.text}</div>
            </div>
        )}
        <div className={cn("space-y-3", chatOverlayMessage && "blur-sm pointer-events-none")}>
          {displayedMessages.length === 0 && isChatActive && (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-75 pt-10">
              <Image
                src="/mulai.png"
                alt="Belum ada pesan"
                width={250}
                height={250}
                className="mb-4 rounded-lg object-contain"
                data-ai-hint="empty chat"
              />
              <p className="text-sm">Belum ada pesan. Mulai percakapan!</p>
            </div>
          )}
           {displayedMessages.length === 0 && !isChatActive && !chatOverlayMessage && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-75 pt-10">
               <Image
                src="/mulai.png"
                alt="Chat tidak aktif"
                width={250}
                height={250}
                className="mb-4 rounded-lg object-contain"
                data-ai-hint="inactive chat"
              />
              <p className="text-sm">Chat ini tidak aktif.</p>
            </div>
          )}
           {displayedMessages.map((msg) => {
            const sender = msg.senderId === currentUser.id
              ? currentUser
              : chat.participants.find(p => p.id === msg.senderId);

            const senderToDisplay : User = sender || {
              id: msg.senderId,
              name: msg.senderName,
              avatarUrl: `https://placehold.co/100x100.png?text=${msg.senderName?.substring(0,1).toUpperCase() || 'U'}`,
              status: "Offline"
            };

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isCurrentUserMessage={msg.senderId === currentUser.id}
                senderDetails={senderToDisplay}
                chatType={chat.type}
                chat={chat}
                onReplyMessage={isChatActive ? handleReplyToMessageInView : undefined}
                onEditMessage={isChatActive ? onRequestEditMessage : undefined}
                onDeleteMessage={isChatActive ? onDeleteMessage : undefined}
              />
            );
          })}
        </div>
        </div>
      </ScrollArea>

      {(replyingToMessage || propsEditingMessageDetails) && isChatActive && (
        <div className="p-3 border-t bg-muted/30 text-sm">
          <div className="flex justify-between items-center text-muted-foreground">
            <div className="truncate flex-1 min-w-0 pr-2">
              {propsEditingMessageDetails ? (
                <>
                  <PencilLine className="inline h-4 w-4 mr-1.5" />
                  <p className="truncate text-xs inline">
                    {propsEditingMessageDetails.content.length > 70 ? propsEditingMessageDetails.content.substring(0, 70) + "..." : propsEditingMessageDetails.content}
                  </p>
                </>
              ) : replyingToMessage && (
                <>
                  <UserIcon className="inline h-4 w-4 mr-1.5" />
                  {replyingToMessage.senderName}
                  <br/>
                  <p className="truncate text-xs inline">
                    {replyingToMessage.content.length > 70 ? replyingToMessage.content.substring(0, 70) + "..." : replyingToMessage.content}
                  </p>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={propsEditingMessageDetails ? handleCancelEditClick : handleCancelReplyClick}
              aria-label={propsEditingMessageDetails ? "Batalkan Edit" : "Batalkan Balasan"}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <footer className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <Textarea
            ref={messageInputRef}
            value={newMessage}
            onChange={handleTextareaInput}
            placeholder={
              !isChatActive
                ? (chat.type === 'direct' && chat.blockedByUser === currentUser.id ? "Anda memblokir pengguna ini" : "Chat tidak aktif")
                : propsEditingMessageDetails
                ? "Edit pesan anda..."
                : replyingToMessage
                ? `Balas ke ${replyingToMessage.senderName}...`
                : "Ketik pesan..."
            }
            className="flex-1 bg-input border-border focus-visible:ring-ring resize-none overflow-y-auto"
            aria-label="Message input"
            disabled={!isChatActive}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && isChatActive) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" size="icon" aria-label="Send message" disabled={!newMessage.trim() || !isChatActive} className="self-end">
            {propsEditingMessageDetails ? <Check className="h-5 w-5" /> : <SendHorizonal className="h-5 w-5" />}
          </Button>
        </form>
      </footer>
    </div>
  );
}

    




    

    