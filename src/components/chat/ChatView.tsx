
"use client";

import type { Chat, Message, User } from "@/types";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { SendHorizonal, Users, User as UserIcon, Info, X, AlertTriangle, Lock, Edit2, PencilLine } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChatViewProps {
  chat: Chat;
  messages: Message[];
  currentUser: User;
  onSendMessage: (content: string, replyToMessage?: Message | null) => void;
  editingMessageDetails: Message | null; // Pesan yang sedang diedit di input utama
  onSaveEditedMessage: (messageId: string, newContent: string) => void; // Untuk menyimpan editan
  onRequestEditMessage: (messageToEdit: Message) => void; // Untuk memulai mode edit
  onCancelEditMessage: () => void; // Untuk membatalkan mode edit
  onDeleteMessage: (messageId: string, chatId: string) => void;
}

export function ChatView({ 
  chat, 
  messages, 
  currentUser, 
  onSendMessage, 
  editingMessageDetails,
  onSaveEditedMessage,
  onRequestEditMessage,
  onCancelEditMessage,
  onDeleteMessage 
}: ChatViewProps) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const isChatActive = chat.type === 'group' || (!chat.pendingApprovalFromUserId && !chat.isRejected);

  // State untuk menyimpan konten asli pesan yang diedit, untuk perbandingan saat membatalkan
  const [originalContentOfEditingMessage, setOriginalContentOfEditingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, chat.id]);

  useEffect(() => {
    // Jika mode edit aktif, isi textarea dengan konten pesan yang diedit
    if (editingMessageDetails) {
      setNewMessage(editingMessageDetails.content);
      setOriginalContentOfEditingMessage(editingMessageDetails.content); // Simpan konten asli
      setReplyingToMessage(null); // Batalkan mode reply jika sedang edit
      messageInputRef.current?.focus();
    } else {
      // Jika mode edit selesai/dibatalkan DAN input masih berisi konten lama dari pesan yg diedit
      // (Artinya pengguna tidak mengubahnya sebelum pembatalan/simpan)
      // Maka kosongkan input. Jika pengguna sudah mengetik hal baru, biarkan.
      if (originalContentOfEditingMessage && newMessage === originalContentOfEditingMessage) {
        setNewMessage("");
      }
      setOriginalContentOfEditingMessage(null); // Reset konten asli
    }
     if (messageInputRef.current && !editingMessageDetails) { // Reset tinggi hanya jika tidak dalam mode edit
        messageInputRef.current.style.height = 'auto';
    }
  }, [editingMessageDetails]);

  // Reset input dan mode reply/edit ketika chat berubah
   useEffect(() => {
    setNewMessage("");
    setReplyingToMessage(null);
    // Jika chat yang dipilih berubah, dan kita sedang dalam mode edit, batalkan mode edit.
    if (editingMessageDetails && editingMessageDetails.chatId !== chat.id) {
      onCancelEditMessage(); 
    }
    if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto';
    }
  }, [chat.id, onCancelEditMessage]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChatActive) {
      toast({ title: "Chat Tidak Aktif", description: "Anda tidak dapat mengirim pesan di chat ini.", variant: "destructive"});
      return;
    }
    if (newMessage.trim()) {
      if (editingMessageDetails) {
        onSaveEditedMessage(editingMessageDetails.id, newMessage.trim());
        // `onSaveEditedMessage` di `page.tsx` akan mengatur `editingMessageDetails` menjadi null,
        // yang akan memicu useEffect di atas untuk membersihkan input jika perlu.
      } else {
        onSendMessage(newMessage.trim(), replyingToMessage);
        setReplyingToMessage(null);
      }
      setNewMessage(""); // Selalu clear textarea setelah send/save
      if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto'; 
      }
    }
  };

  const handleReplyToMessageInView = (messageToReply: Message) => {
    if(!isChatActive) return;
    if (editingMessageDetails) onCancelEditMessage(); // Batalkan edit jika memulai reply
    setReplyingToMessage(messageToReply);
    messageInputRef.current?.focus();
  };
  
  const handleCancelEditClick = () => {
    onCancelEditMessage();
    // useEffect akan menangani pembersihan input jika diperlukan
  };

  const getChatDisplayDetails = () => {
    if (chat.type === "direct") {
      const otherParticipant = chat.participants?.find(p => p.id !== currentUser.id);
      const otherParticipantName = otherParticipant?.name || chat.name || "Direct Chat";
      const otherParticipantAvatar = otherParticipant?.avatarUrl || chat.avatarUrl;
      const otherParticipantStatus = otherParticipant?.status || "Offline";
      return {
        name: otherParticipantName,
        avatarUrl: otherParticipantAvatar,
        Icon: UserIcon,
        description: `Direct message with ${otherParticipantName}`,
        status: otherParticipantStatus
      };
    } else {
      const groupName = chat.name || "Unnamed Group";
      return {
        name: groupName,
        avatarUrl: chat.avatarUrl,
        Icon: Users,
        description: `${chat.participants?.length || 0} members: ${chat.participants?.map(p => p.name || 'Unknown').join(', ') || ''}`,
        status: null
      };
    }
  };

  const displayDetails = getChatDisplayDetails();

  let chatOverlayMessage = null;
  if (chat.type === 'direct') {
    const otherUserName = displayDetails.name === "Direct Chat" ? "pengguna ini" : displayDetails.name;
    if (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser.id) {
      chatOverlayMessage = {
        icon: <SendHorizonal className="w-16 h-16 text-muted-foreground mb-4" />,
        title: "Menunggu Persetujuan",
        text: `Permintaan chat Anda kepada ${otherUserName} sedang menunggu persetujuan.`,
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
        icon: <Lock className="w-16 h-16 text-destructive mb-4" />,
        title: "Permintaan Ditolak",
        text: `${rejecterName} telah menolak permintaan chat dengan ${rejectedTargetName}.`,
      };
    }
  }

  const handleTextareaInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(event.target.value);
    if (messageInputRef.current) {
      messageInputRef.current.style.height = 'auto'; 
      const newHeight = Math.min(messageInputRef.current.scrollHeight, 120) 
      messageInputRef.current.style.height = `${newHeight}px`;
    }
  };


  return (
    <div className="flex flex-col flex-1 bg-background overflow-hidden">
      <Sheet>
        <header className="p-4 border-b flex items-center justify-between shadow-sm">
          <SheetTrigger asChild>
            <div className="flex items-center space-x-3 cursor-pointer group flex-1 min-w-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={displayDetails.avatarUrl} alt={displayDetails.name || 'Chat Avatar'} data-ai-hint={chat.type === 'group' ? 'group abstract' : 'person abstract'}/>
                <AvatarFallback>
                  <displayDetails.Icon className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold group-hover:underline truncate">{displayDetails.name}</h2>
                <p className="text-xs text-muted-foreground truncate">
                  {chat.type === 'direct'
                    ? (isChatActive ? (displayDetails.status || (currentUser.id === chat.participants?.find(p => p.id === currentUser.id)?.id ? currentUser.status : "Offline")) : "Inactive")
                    : `Group Chat - ${chat.participants?.length || 0} members`}
                </p>
              </div>
            </div>
          </SheetTrigger>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-2">
              <Info className="h-5 w-5" />
              <span className="sr-only">Chat Info</span>
            </Button>
          </SheetTrigger>
        </header>

        <SheetContent>
          <SheetHeader className="mb-4">
            {chat.type === 'direct' ? (
              <div className="flex flex-col items-center text-center space-y-3 pt-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={displayDetails.avatarUrl} alt={displayDetails.name || 'User Avatar'} data-ai-hint="person abstract large"/>
                  <AvatarFallback>
                    <displayDetails.Icon className="h-12 w-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <SheetTitle className="text-2xl">{displayDetails.name}</SheetTitle>
                <SheetDescription className="text-base">
                 Status: <span className={cn("font-medium", isChatActive && displayDetails.status === "Online" ? "text-green-500" : "text-muted-foreground")}>
                    {isChatActive ? (displayDetails.status || "Offline") : "Tidak Aktif"}
                  </span> (Simulated)
                </SheetDescription>
              </div>
            ) : (
              <div className="text-center pt-4">
                 <Avatar className="h-24 w-24 mx-auto mb-3">
                    <AvatarImage src={displayDetails.avatarUrl} alt={displayDetails.name || 'Group Avatar'} data-ai-hint="group abstract large"/>
                    <AvatarFallback>
                        <displayDetails.Icon className="h-12 w-12 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
                <SheetTitle className="text-2xl">{displayDetails.name}</SheetTitle>
                <SheetDescription className="text-base">{displayDetails.description}</SheetDescription>
              </div>
            )}
          </SheetHeader>
          <div className="py-2 border-t">
            <h4 className="font-semibold mb-2 text-sm px-1">Participants</h4>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <ul className="space-y-1 text-sm">
                {chat.participants?.map(participantUser => {
                  const isCurrentUserParticipant = participantUser.id === currentUser.id;
                  const participantName = participantUser.name || "Unknown User";
                  return (
                    <li key={participantUser.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={participantUser.avatarUrl} alt={participantName} data-ai-hint="person abstract small"/>
                         <AvatarFallback>{participantUser?.name?.substring(0,1).toUpperCase() || '?'}</AvatarFallback>
                       </Avatar>
                       <span className="truncate">
                        {participantName}
                        {isCurrentUserParticipant && " (You)"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <ScrollArea className="flex-1" viewportRef={viewportRef} ref={scrollAreaRef}>
        {chatOverlayMessage && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 z-10">
                {chatOverlayMessage.icon}
                <h3 className="text-xl font-semibold mb-2">{chatOverlayMessage.title}</h3>
                <p className="text-muted-foreground">{chatOverlayMessage.text}</p>
            </div>
        )}
        <div className={cn("p-4 space-y-4 mb-4", chatOverlayMessage && "blur-sm pointer-events-none")}>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isCurrentUserMessage={msg.senderId === currentUser.id}
              onReplyMessage={isChatActive ? handleReplyToMessageInView : undefined}
              onEditMessage={isChatActive ? onRequestEditMessage : undefined} // Menggunakan onRequestEditMessage
              onDeleteMessage={isChatActive ? onDeleteMessage : undefined}
            />
          ))}
          {messages.length === 0 && isChatActive && (
            <div className="text-center text-muted-foreground py-10">
              No messages yet. Be the first to send one!
            </div>
          )}
           {messages.length === 0 && !isChatActive && !chatOverlayMessage && ( 
            <div className="text-center text-muted-foreground py-10">
              Chat ini tidak aktif.
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Indikator reply atau edit */}
      {(replyingToMessage || editingMessageDetails) && isChatActive && (
        <div className="p-3 border-t bg-muted/30 text-sm">
          <div className="flex justify-between items-center text-muted-foreground">
            <div className="truncate flex-1 min-w-0 pr-2">
              {editingMessageDetails ? (
                <>
                  <PencilLine className="inline h-4 w-4 mr-1.5 text-amber-600" />
                  <span className="font-medium text-amber-700">Mengedit pesan:</span>
                  <p className="italic truncate text-xs">
                    "{editingMessageDetails.content.length > 70 ? editingMessageDetails.content.substring(0, 70) + "..." : editingMessageDetails.content}"
                  </p>
                </>
              ) : replyingToMessage && (
                <>
                  <span className="font-medium">Membalas {replyingToMessage.senderName}:</span>
                  <p className="italic truncate text-xs">
                    "{replyingToMessage.content.length > 70 ? replyingToMessage.content.substring(0, 70) + "..." : replyingToMessage.content}"
                  </p>
                </>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 shrink-0" 
              onClick={editingMessageDetails ? handleCancelEditClick : () => setReplyingToMessage(null)}
              aria-label={editingMessageDetails ? "Batalkan Edit" : "Batalkan Balasan"}
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
                ? "Chat tidak aktif" 
                : editingMessageDetails 
                ? "Edit pesan Anda..." 
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
               if (e.key === 'Escape' && editingMessageDetails) {
                e.preventDefault();
                handleCancelEditClick();
              }
            }}
          />
          <Button type="submit" size="icon" aria-label="Send message" disabled={!newMessage.trim() || !isChatActive} className="self-end">
            {editingMessageDetails ? <Check className="h-5 w-5" /> : <SendHorizonal className="h-5 w-5" />}
          </Button>
        </form>
      </footer>
    </div>
  );
}

    
