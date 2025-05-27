
"use client";

import type { Message } from "@/types";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { Undo2, MoreVertical, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageBubbleProps {
  message: Message;
  isCurrentUserMessage: boolean;
  onReplyMessage?: (message: Message) => void;
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (messageId: string, chatId: string) => void;
}

export function MessageBubble({
  message,
  isCurrentUserMessage,
  onReplyMessage,
  onEditMessage,
  onDeleteMessage,
}: MessageBubbleProps) {

  const handleReply = () => {
    onReplyMessage?.(message);
  };
  const handleEdit = () => {
    onEditMessage?.(message);
  };
  const handleDelete = () => {
    onDeleteMessage?.(message.id, message.chatId);
  };

  return (
    <div className={cn(
      "flex items-center group w-full",
      isCurrentUserMessage ? "justify-end pl-2" : "justify-start pr-2"
    )}>
      {/* Action buttons for current user's messages (appear on the left on hover) */}
      {isCurrentUserMessage && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity order-1 mr-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 p-1 text-muted-foreground hover:bg-muted/20">
                <MoreVertical size={16} />
                <span className="sr-only">Opsi pesan</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReply}>
                <Undo2 size={14} className="mr-2" />
                Balas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit3 size={14} className="mr-2" />
                Edit Pesan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive-foreground"
              >
                <Trash2 size={14} className="mr-2" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Message Bubble Content */}
      <div className={cn(
        "max-w-[70%] shadow-sm flex flex-col px-3 py-2 relative", // Added relative for tail positioning
        isCurrentUserMessage
          ? "bg-primary text-primary-foreground rounded-b-lg rounded-tl-lg order-2"
          : "bg-card text-card-foreground rounded-b-lg rounded-tr-lg border order-1"
      )}>
        {/* Tail for current user message */}
        {isCurrentUserMessage && (
          <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-primary border-l-[10px] border-l-transparent"></div>
        )}
        {/* Tail for other user message */}
        {!isCurrentUserMessage && (
          <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-card border-r-[10px] border-r-transparent"></div>
        )}

        {!isCurrentUserMessage && (
          <p className="text-xs font-semibold mb-0.5 text-accent-foreground">{message.senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className="flex justify-end mt-1 items-center">
          {message.isEdited && (
             <span className={cn(
                "text-xs italic mr-2",
                isCurrentUserMessage ? "text-primary-foreground/70" : "text-muted-foreground/70"
            )}>(edited)</span>
          )}
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
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity order-2 ml-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 p-1 text-teal-500 hover:bg-teal-500/10 hover:text-teal-600" aria-label="Reply to message" onClick={handleReply}>
            <Undo2 size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
