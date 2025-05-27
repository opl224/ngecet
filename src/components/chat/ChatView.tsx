
"use client";

import type { Chat, Message, User } from "@/types";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { SendHorizonal, Users, User as UserIcon, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface ChatViewProps {
  chat: Chat;
  messages: Message[];
  currentUser: User;
  onSendMessage: (content: string) => void;
}

export function ChatView({ chat, messages, currentUser, onSendMessage }: ChatViewProps) {
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, chat.id]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const getChatDisplayDetails = () => {
    if (chat.type === "direct") {
      const otherParticipantId = chat.participants.find(p => p !== currentUser.id);
      // Mengubah ID menjadi nama dengan format yang lebih baik (misal: 'jane_doe' menjadi 'Jane Doe')
      const otherParticipantName = otherParticipantId 
        ? otherParticipantId.split('_').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ') 
        : "Unknown User";
      return {
        name: otherParticipantName,
        avatarUrl: chat.avatarUrl, // AvatarURL dari chat object untuk DM
        Icon: UserIcon,
        description: `Direct message with ${otherParticipantName}`,
      };
    } else { // group
      return {
        name: chat.name || "Unnamed Group",
        avatarUrl: chat.avatarUrl, // AvatarURL dari chat object untuk Group
        Icon: Users,
        description: `${chat.participants.length} members: ${chat.participants.map(p => p.split('_').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ')).join(', ')}`,
      };
    }
  };

  const displayDetails = getChatDisplayDetails();

  return (
    <div className="flex flex-col h-full bg-background">
      <Sheet>
        <header className="p-4 border-b flex items-center justify-between shadow-sm">
          <SheetTrigger asChild>
            <div className="flex items-center space-x-3 cursor-pointer group flex-1 min-w-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={displayDetails.avatarUrl} alt={displayDetails.name} data-ai-hint={chat.type === 'group' ? 'group abstract' : 'person abstract'}/>
                <AvatarFallback>
                  <displayDetails.Icon className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold group-hover:underline truncate">{displayDetails.name}</h2>
                <p className="text-xs text-muted-foreground truncate">{chat.type === 'direct' ? 'Direct Message' : `Group Chat - ${chat.participants.length} members`}</p>
              </div>
            </div>
          </SheetTrigger>
          {/* Tombol Info eksplisit masih bisa ada jika diperlukan, atau diintegrasikan */}
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
                  <AvatarImage src={displayDetails.avatarUrl} alt={displayDetails.name} data-ai-hint="person abstract large" />
                  <AvatarFallback>
                    <displayDetails.Icon className="h-12 w-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <SheetTitle className="text-2xl">{displayDetails.name}</SheetTitle>
                <SheetDescription className="text-base">
                  Status: <span className="text-green-500 font-medium">Online</span> (Simulated)
                </SheetDescription>
              </div>
            ) : (
              <div className="text-center pt-4">
                 <Avatar className="h-24 w-24 mx-auto mb-3">
                    <AvatarImage src={displayDetails.avatarUrl} alt={displayDetails.name} data-ai-hint="group abstract large"/>
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
            <ScrollArea className="h-[calc(100vh-280px)]"> {/* Adjust height as needed */}
              <ul className="space-y-1 text-sm">
                {chat.participants.map(participantId => {
                  const participantName = participantId.split('_').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
                  const isCurrentUserParticipant = participantId === currentUser.id;
                  const participantAvatarInitial = participantName.substring(0,1) || '?';
                  // Di aplikasi nyata, Anda akan mengambil avatarUrl dari data user
                  const participantAvatarUrl = isCurrentUserParticipant ? currentUser.avatarUrl : `https://placehold.co/40x40.png?text=${participantAvatarInitial}`;

                  return (
                    <li key={participantId} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={participantAvatarUrl} alt={participantName} data-ai-hint="person abstract small"/>
                         <AvatarFallback>{participantAvatarInitial}</AvatarFallback>
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

      <ScrollArea className="flex-1 p-4" viewportRef={viewportRef} ref={scrollAreaRef}>
        <div className="space-y-4 mb-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isCurrentUserMessage={msg.senderId === currentUser.id}
            />
          ))}
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              No messages yet. Be the first to send one!
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-input border-border focus-visible:ring-ring"
            aria-label="Message input"
          />
          <Button type="submit" size="icon" aria-label="Send message" disabled={!newMessage.trim()}>
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
