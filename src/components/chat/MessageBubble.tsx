
"use client";

import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { Undo2, Trash2 } from "lucide-react"; 
import { Button } from "@/components/ui/button"; 

interface MessageBubbleProps {
  message: Message;
  isCurrentUserMessage: boolean;
}

export function MessageBubble({ message, isCurrentUserMessage }: MessageBubbleProps) {

  return (
    <div className={cn(
      "flex items-center group w-full", // Changed items-end to items-center
      isCurrentUserMessage ? "justify-end pl-2" : "justify-start pr-2"
    )}>
      {/* Action buttons for current user's messages (appear on the left on hover) */}
      {isCurrentUserMessage && (
        <div className="flex flex-col-reverse sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 opacity-0 group-hover:opacity-100 transition-opacity order-1 mr-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 p-1 text-red-500 hover:bg-red-500/10 hover:text-red-600" aria-label="Delete message">
            <Trash2 size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 p-1 text-teal-500 hover:bg-teal-500/10 hover:text-teal-600" aria-label="Reply to message">
            <Undo2 size={16} />
          </Button>
        </div>
      )}

      {/* Message Bubble Content */}
      <div className={cn(
        "max-w-[70%] rounded-lg shadow-sm flex flex-col px-3 py-2",
        isCurrentUserMessage 
          ? "bg-primary text-primary-foreground rounded-tr-none order-2" 
          : "bg-card text-card-foreground rounded-tl-none border order-1"
      )}>
        {!isCurrentUserMessage && (
          <p className="text-xs font-semibold mb-0.5 text-accent-foreground">{message.senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className="flex justify-end mt-1">
            <p className={cn(
                "text-xs",
                isCurrentUserMessage ? "text-primary-foreground/70" : "text-muted-foreground/70"
            )}>
            {format(new Date(message.timestamp), "p")}
            </p>
        </div>
      </div>

      {/* Action buttons for other users' messages (appear on the right on hover) */}
      {!isCurrentUserMessage && (
        <div className="flex flex-col-reverse sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 opacity-0 group-hover:opacity-100 transition-opacity order-2 ml-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 p-1 text-teal-500 hover:bg-teal-500/10 hover:text-teal-600" aria-label="Reply to message">
            <Undo2 size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 p-1 text-red-500 hover:bg-red-500/10 hover:text-red-600" aria-label="Delete message">
            <Trash2 size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
