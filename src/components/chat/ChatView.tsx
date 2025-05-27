
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
      const otherParticipantName = otherParticipantId || "Unknown User";
      return {
        name: otherParticipantName,
        avatarUrl: chat.avatarUrl,
        Icon: UserIcon,
        description: `Direct message with ${otherParticipantName}`,
      };
    } else {
      return {
        name: chat.name || "Unnamed Group",
        avatarUrl: chat.avatarUrl,
        Icon: Users,
        description: `${chat.participants.length} members: ${chat.participants.join(', ')}`,
      };
    }
  };

  const displayDetails = getChatDisplayDetails();

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={displayDetails.avatarUrl} alt={displayDetails.name} data-ai-hint={chat.type === 'group' ? 'group people' : 'person abstract'}/>
            <AvatarFallback>
              <displayDetails.Icon className="h-5 w-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{displayDetails.name}</h2>
            <p className="text-xs text-muted-foreground">{chat.type === 'direct' ? 'Direct Message' : 'Group Chat'}</p>
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Info className="h-5 w-5" />
              <span className="sr-only">Chat Info</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{displayDetails.name}</SheetTitle>
              <SheetDescription>{displayDetails.description}</SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <h4 className="font-semibold mb-2">Participants</h4>
              <ul className="space-y-1 text-sm">
                {chat.participants.map(participantId => (
                  <li key={participantId}>{participantId === currentUser.id ? `${participantId} (You)` : participantId}</li>
                ))}
              </ul>
            </div>
          </SheetContent>
        </Sheet>
      </header>

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
