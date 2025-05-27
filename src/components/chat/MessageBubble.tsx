
"use client";

import type { Message as MessageType, User } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Pencil, CornerUpLeft, Trash2 } from 'lucide-react';

interface MessageBubbleProps {
  message: MessageType;
  sender?: User;
  isCurrentUser: boolean;
}

const MessageBubble = ({ message, sender, isCurrentUser }: MessageBubbleProps) => {
  const bubbleAlignmentClass = isCurrentUser ? "justify-end" : "justify-start";
  // Removed bubbleContainerOrderClass as it's implicitly handled by avatar presence and isCurrentUser logic

  // Placeholder functions for actions - implement actual logic later
  const handleReply = () => console.log("Reply to message:", message.id);
  const handleDelete = () => console.log("Delete message:", message.id);

  return (
    <div className={cn("group/message flex w-full mb-2 animate-fadeIn", 
                       isCurrentUser ? "justify-end" : "justify-start",
                       // Align items to the start (top) of the row to better handle multi-line messages with avatars
                       "items-start" 
                     )}>
      {!isCurrentUser && sender && (
        <Avatar className="h-8 w-8 self-end mr-2 flex-shrink-0"> {/* Ensure avatar doesn't shrink text */}
          <AvatarImage src={sender.avatarUrl} alt={sender.name} data-ai-hint="avatar person" />
          <AvatarFallback>{sender.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
          "flex items-center", // Changed from items-end to items-center for vertical centering of bubble & actions
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
            <p className="text-xs font-semibold mb-0.5 text-foreground/80">{sender.name}</p>
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
            "flex flex-col space-y-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-150",
            isCurrentUser ? "ml-1.5" : "mr-1.5" // Ensure margin is on the correct side
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/50 hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-full p-1 shadow-sm"
              onClick={handleReply}
              aria-label="Reply"
            >
              <CornerUpLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/50 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-full p-1 shadow-sm"
              onClick={handleDelete}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
