
"use client";

import type { Message as MessageType, User } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: MessageType;
  sender?: User;
  isCurrentUser: boolean;
}

const MessageBubble = ({ message, sender, isCurrentUser }: MessageBubbleProps) => {
  const alignmentClass = isCurrentUser ? "items-end" : "items-start";
  const bubbleClass = isCurrentUser
    ? "bg-primary text-primary-foreground rounded-tr-none"
    : "bg-card text-card-foreground rounded-tl-none border";
  const avatarOrderClass = isCurrentUser ? "order-2 ml-2" : "order-1 mr-2";
  const textOrderClass = isCurrentUser ? "order-1" : "order-2";

  return (
    <div className={cn("flex flex-col mb-3 animate-fadeIn", alignmentClass)}>
      <div className={cn("flex items-end max-w-[75%]", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
        {!isCurrentUser && sender && (
          <Avatar className={cn("h-8 w-8 self-end", avatarOrderClass)}>
            <AvatarImage src={sender.avatarUrl} alt={sender.name} data-ai-hint="avatar person" />
            <AvatarFallback>{sender.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div className={cn("p-3 rounded-xl shadow-md", bubbleClass, textOrderClass)}>
          {!isCurrentUser && sender && (
            <p className="text-xs font-semibold mb-1">{sender.name}</p>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        </div>
      </div>
      <p className={cn("text-xs text-muted-foreground mt-1", isCurrentUser ? "text-right mr-1" : "text-left ml-10")}>
        {format(new Date(message.timestamp), 'p')}
      </p>
       <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MessageBubble;
