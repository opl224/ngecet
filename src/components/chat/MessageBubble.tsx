
"use client";

import type { Message as MessageType, User } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Pencil, CornerUpLeft, Trash2, MoreHorizontal } from 'lucide-react';

interface MessageBubbleProps {
  message: MessageType;
  sender?: User;
  isCurrentUser: boolean;
}

const MessageBubble = ({ message, sender, isCurrentUser }: MessageBubbleProps) => {
  // Ensure displayName truncation logic is applied: max 25 chars, 22 + "..."
  const displayName = sender?.name ? (sender.name.length > 25 ? sender.name.substring(0, 22) + "..." : sender.name) : "";
  
  // Placeholder functions for actions - implement actual logic later
  const handleReply = () => console.log("Reply to message:", message.id);
  const handleDelete = () => console.log("Delete message:", message.id);

  return (
    <div className={cn("group/message flex w-full mb-2 animate-fadeIn", 
                       isCurrentUser ? "justify-end" : "justify-start",
                       "items-start" 
                     )}>
      {!isCurrentUser && sender && (
        <Avatar className="h-8 w-8 self-end mr-2 flex-shrink-0">
          <AvatarImage src={sender.avatarUrl} alt={sender.name} data-ai-hint="avatar person" />
          <AvatarFallback>{sender.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
          "flex items-center", 
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div
          className={cn(
            "p-2.5 rounded-lg shadow-md max-w-[calc(100%-4rem)] sm:max-w-[75%] min-w-[80px]",
            isCurrentUser
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-card text-card-foreground border rounded-bl-none"
          )}
        >
          {!isCurrentUser && sender && (
            <p className="text-xs font-semibold mb-0.5 text-foreground/80" title={sender.name}>{displayName}</p>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
          <div
            className={cn(
              "flex items-center justify-end mt-1.5 text-xs space-x-1",
              isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {message.isEdited && <Pencil className="h-3 w-3" title="Edited" />}
            <span>{format(new Date(message.timestamp), 'p')}</span>
          </div>
        </div>

        {isCurrentUser && (
          <div className={cn(
            "opacity-0 group-hover/message:opacity-100 transition-opacity duration-150",
            isCurrentUser ? "ml-1.5" : "mr-1.5" 
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-background/50 hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-full p-1 shadow-sm"
                  aria-label="Message options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end">
                <DropdownMenuItem onClick={handleReply} className="gap-2">
                  <CornerUpLeft className="h-4 w-4" />
                  <span>Reply</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
       <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MessageBubble;
