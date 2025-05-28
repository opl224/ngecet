
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
  senderDetails: User; // Details of the actual sender
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
      "flex w-full group mb-3", 
      isCurrentUserMessage ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex items-start gap-2.5", 
        isCurrentUserMessage ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <Avatar className="h-8 w-8 shrink-0 mt-3.5"> {/* mt-3.5 to align with first line of text if name is shown */}
          <AvatarImage src={senderAvatarUrl} alt={senderName} data-ai-hint="person" />
          <AvatarFallback>{senderInitial}</AvatarFallback>
        </Avatar>

        {/* Content column: Name + Bubble */}
        <div className={cn(
          "flex flex-col",
          isCurrentUserMessage ? "items-end" : "items-start" 
        )}>
          {/* Name and (Anda) label */}
          <div className={cn(
              "flex items-center text-xs text-muted-foreground mb-0.5 px-1",
          )}>
              <span>{senderName}</span>
              {isCurrentUserMessage && <span className="ml-1 font-normal text-muted-foreground">(Anda)</span>}
          </div>

          {/* Bubble and Actions container */}
          <div className={cn(
            "flex items-center w-fit", 
            isCurrentUserMessage ? "flex-row-reverse" : "flex-row" 
          )}>
            {/* Actions: Dropdown for current user, Reply button for others */}
            {((isCurrentUserMessage && onDeleteMessage && onEditMessage && onReplyMessage) || (!isCurrentUserMessage && onReplyMessage)) && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center shrink-0 mx-1">
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

            {/* Actual Message Bubble */}
            <div className={cn(
              "shadow-sm flex flex-col px-3 py-2 text-sm max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg", // Added max-widths
              isCurrentUserMessage
                ? "bg-primary text-primary-foreground rounded-l-xl rounded-br-xl" 
                : "bg-card text-card-foreground rounded-r-xl rounded-bl-xl border" 
            )}>
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
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
