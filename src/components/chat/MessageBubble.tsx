
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

  const BubbleContentLayout = () => (
    <div className={cn(
      "shadow-sm flex flex-col px-3 py-2 text-sm max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg",
      isCurrentUserMessage
        ? "bg-primary text-primary-foreground rounded-l-xl rounded-bl-xl rounded-tr-md ml-auto" // Added ml-auto back here for right alignment
        : "bg-card text-card-foreground rounded-r-xl rounded-br-xl rounded-tl-md border" 
    )}>
      <div className={cn(
          "text-xs font-semibold mb-0.5",
          isCurrentUserMessage ? "text-primary-foreground/90" : "text-primary"
      )}>
          {isCurrentUserMessage ? (
            <span className="font-normal text-primary-foreground/70">(Anda)</span>
          ) : (
            <span>{senderName}</span>
          )}
      </div>

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
  );


  const SenderActionButtons = () => (
    onDeleteMessage && onEditMessage && onReplyMessage && (
      <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 p-1 text-muted-foreground hover:text-primary">
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
              className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive"
            >
              <Trash2 size={14} className="mr-2" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  );

  const ReceiverActionButton = () => (
    onReplyMessage && (
      <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center shrink-0">
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 p-1 text-muted-foreground hover:text-primary">
              <MoreVertical size={16} />
              <span className="sr-only">Opsi pesan</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={handleReply}>
              <Undo2 size={14} className="mr-2" />
              Balas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  );

  const UserAvatarComponent = () => (
    <Avatar className="h-8 w-8 shrink-0 self-start mt-1">
      <AvatarImage src={senderAvatarUrl} alt={senderName} data-ai-hint="person" />
      <AvatarFallback>{senderInitial}</AvatarFallback>
    </Avatar>
  );

  return (
    <div className={cn(
        "flex w-full group mb-3 items-start gap-2.5", 
        isCurrentUserMessage && "justify-end" // This will push the entire row to the right for current user messages
      )}
    >
      {isCurrentUserMessage ? (
        <>
          <SenderActionButtons />
          <BubbleContentLayout /> 
          <UserAvatarComponent />
        </>
      ) : (
        <>
          <UserAvatarComponent />
          <BubbleContentLayout />
          <ReceiverActionButton />
        </>
      )}
    </div>
  );
}
