
"use client";

import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isCurrentUserMessage: boolean;
}

export function MessageBubble({ message, isCurrentUserMessage }: MessageBubbleProps) {
  const getInitials = (name: string) => {
    if (!name) return "??";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }

  return (
    <div className={cn("flex items-end space-x-2 group", isCurrentUserMessage ? "justify-end" : "justify-start")}>
      {!isCurrentUserMessage && (
        <Avatar className="h-8 w-8 self-start">
          {/* In a real app, fetch sender's avatarUrl based on message.senderId */}
          <AvatarImage src={undefined} alt={message.senderName} data-ai-hint="person icon" />
          <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn("max-w-[70%] p-3 rounded-lg shadow-sm", 
        isCurrentUserMessage ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none border"
      )}>
        {!isCurrentUserMessage && (
          <p className="text-xs font-semibold mb-1 text-accent-foreground">{message.senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn(
          "text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isCurrentUserMessage ? "text-primary-foreground/70 text-right" : "text-muted-foreground/70 text-left"
        )}>
          {format(new Date(message.timestamp), "p")}
        </p>
      </div>
      {isCurrentUserMessage && (
        <Avatar className="h-8 w-8 self-start">
          <AvatarImage src={undefined} alt={message.senderName} data-ai-hint="person icon" />
          <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
