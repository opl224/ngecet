
"use client";

import type { Message, User } from "@/types";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageBubbleProps {
  message: Message;
  isCurrentUserMessage: boolean;
  senderDetails: User;
  onReplyMessage?: (message: Message) => void;
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (messageId: string, chatId: string) => void;
}

export function MessageBubble({
  message,
  isCurrentUserMessage,
  senderDetails,
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

  const senderName = senderDetails.name || "Unknown User";
  const senderAvatarUrl = senderDetails.avatarUrl;
  const senderInitial = senderDetails.name ? senderDetails.name.substring(0, 1).toUpperCase() : "?";

  return (
    <div className={cn(
      "flex w-full group mb-3 items-start gap-2.5"
    )}>
      {/* Avatar always on the left */}
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        <AvatarImage src={senderAvatarUrl} alt={senderName} data-ai-hint="person" />
        <AvatarFallback>{senderInitial}</AvatarFallback>
      </Avatar>

      {/* Bubble Content */}
      <div className={cn(
        "shadow-sm flex flex-col px-3 py-2 text-sm max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg",
        isCurrentUserMessage
          ? "ml-auto bg-primary text-primary-foreground rounded-l-xl rounded-tr-xl rounded-br-md" 
          : "bg-card text-card-foreground rounded-r-xl rounded-tl-xl rounded-bl-md border" 
      )}>
        {/* Sender Name (inside bubble) */}
        <div className={cn(
            "text-xs font-semibold mb-0.5",
            isCurrentUserMessage ? "text-primary-foreground/90" : "text-primary"
        )}>
            <span>{senderName}</span>
            {isCurrentUserMessage && <span className="ml-1 font-normal text-primary-foreground/70">(Anda)</span>}
        </div>

        {/* Reply Block (if any) */}
        {message.replyToMessageId && message.replyToMessageSenderName && message.replyToMessageContent && (
          <div className={cn(
            "mb-1.5 pt-1 pb-1 pl-2 pr-1 rounded",
            "border-l-4",
            isCurrentUserMessage ? "border-primary-foreground/50 bg-primary-foreground/10" : "border-primary bg-muted/70"
          )}>
            <p className={cn(
              "text-xs font-semibold",
              isCurrentUserMessage ? "text-primary-foreground" : "text-primary"
            )}>{message.replyToMessageSenderName}</p>
            <p className={cn(
              "text-xs opacity-90",
              isCurrentUserMessage ? "text-primary-foreground/90" : "text-card-foreground/90"
            )} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message.replyToMessageContent}
            </p>
          </div>
        )}

        {/* Message Content */}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* Timestamp and Edited Status */}
        <div className={cn(
            "flex items-center mt-1",
            isCurrentUserMessage ? "justify-end" : "justify-start" 
        )}>
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

      {/* Action Buttons (to the right of the bubble, appears on hover) */}
      {((isCurrentUserMessage && onDeleteMessage && onEditMessage && onReplyMessage) || (!isCurrentUserMessage && onReplyMessage)) && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center shrink-0">
          {isCurrentUserMessage && onDeleteMessage && onEditMessage && onReplyMessage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 p-1 text-muted-foreground hover:text-primary">
                  <MoreVertical size={16} />
                  <span className="sr-only">Opsi pesan</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onReplyMessage && (
                  <DropdownMenuItem onClick={handleReply}>
                    <Undo2 size={14} className="mr-2" />
                    Balas
                  </DropdownMenuItem>
                )}
                {onEditMessage && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit3 size={14} className="mr-2" />
                    Edit Pesan
                  </DropdownMenuItem>
                )}
                {(onReplyMessage || onEditMessage) && onDeleteMessage && <DropdownMenuSeparator />}
                {onDeleteMessage && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Hapus
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {!isCurrentUserMessage && onReplyMessage && (
            <Button variant="ghost" size="icon" className="h-7 w-7 p-1 text-muted-foreground hover:text-primary" aria-label="Reply to message" onClick={handleReply}>
              <Undo2 size={16} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
