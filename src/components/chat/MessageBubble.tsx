
"use client";

import * as React from "react"; // Added this line
import type { Message, User, ChatType, Chat } from "@/types";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
import { Undo2, MoreVertical, Edit3, Trash2, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { HTMLAttributes } from 'react';


interface MessageBubbleProps {
  message: Message;
  isCurrentUserMessage: boolean;
  senderDetails: User;
  chatType: ChatType;
  chat: Chat;
  onReplyMessage?: (message: Message) => void;
  onEditMessage?: (message: Message) => void;
  onDeleteMessage?: (messageId: string, chatId: string) => void;
}

export function MessageBubble({
  message,
  isCurrentUserMessage,
  senderDetails,
  chatType,
  chat,
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

  let isReadByAtLeastOneOther = false;
  if (isCurrentUserMessage && chat.lastReadBy) {
    const messageTimestamp = message.timestamp;
    if (chat.type === 'direct') {
      const otherParticipant = chat.participants.find(p => p.id !== senderDetails.id);
      if (otherParticipant) {
        const theirLastReadTimestamp = chat.lastReadBy[otherParticipant.id] || 0;
        if (messageTimestamp <= theirLastReadTimestamp) {
          isReadByAtLeastOneOther = true;
        }
      }
    } else if (chat.type === 'group') {
      for (const participant of chat.participants) {
        if (participant.id !== senderDetails.id) {
          const theirLastReadTimestamp = chat.lastReadBy[participant.id] || 0;
          if (messageTimestamp <= theirLastReadTimestamp) {
            isReadByAtLeastOneOther = true;
            break;
          }
        }
      }
    }
  }

  interface BubbleContentLayoutProps extends HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
  }

  const BubbleContentLayout = React.forwardRef<HTMLDivElement, BubbleContentLayoutProps>(
    ({ className: bubbleClassName, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "shadow-sm flex flex-col px-3 py-3 text-sm max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg relative",
        isCurrentUserMessage
          ? "bg-primary text-primary-foreground rounded-l-xl rounded-tr-xl"
          : "bg-card text-card-foreground rounded-r-xl rounded-tl-xl border",
        bubbleClassName
      )}
      {...props}
    >
      {(isCurrentUserMessage && chatType === 'group') || (!isCurrentUserMessage && chatType === 'group') ? (
          <div className={cn(
              "text-xs font-semibold mb-0.5",
              isCurrentUserMessage ? "text-primary-foreground/90" : "text-accent-foreground"
          )}>
              <span>
                {isCurrentUserMessage && chatType === 'group'
                  ? "Anda"
                  : senderName
                }
              </span>
          </div>
      ) : isCurrentUserMessage && chatType === 'direct' ? (
        <div className={cn(
          "text-xs font-semibold mb-0.5 text-primary-foreground/90"
        )}>
          {/* No name for self in direct chat */}
        </div>
      ) : null}


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
          "flex items-center mt-1 self-end",
      )}>
        {message.isEdited && (
           <span className={cn(
              "text-[10px] italic mr-1.5",
              isCurrentUserMessage ? "text-primary-foreground/70" : "text-muted-foreground/70"
          )}>(edited)</span>
        )}
        <p className={cn(
            "text-[10px]",
            isCurrentUserMessage ? "text-primary-foreground/70" : "text-muted-foreground/70"
        )}>
          {format(new Date(message.timestamp), "HH:mm", { locale: idLocale })}
        </p>
        {isCurrentUserMessage && (
          <span className="ml-1">
            {isReadByAtLeastOneOther ? (
              <CheckCheck size={14} className="text-blue-500" />
            ) : (
              <Check size={14} className={cn("text-primary-foreground/70")} />
            )}
          </span>
        )}
      </div>
    </div>
  ));
  BubbleContentLayout.displayName = "BubbleContentLayout";


  const SenderActionButtons = ({ className }: { className?: string }) => (
    onEditMessage && onDeleteMessage && (
      <div className={cn("opacity-0 group-hover:opacity-100 transition-opacity self-center", className)}>
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
            {isCurrentUserMessage && onEditMessage && (
              <DropdownMenuItem onClick={handleEdit}>
                <Edit3 size={14} className="mr-2" />
                Edit Pesan
              </DropdownMenuItem>
            )}
            {isCurrentUserMessage && onDeleteMessage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Hapus
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  );

  const ReceiverActionButton = ({ className }: { className?: string }) => (
    onReplyMessage && (
       <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7 p-1 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity self-center", className)}
          onClick={handleReply}
          aria-label="Balas"
        >
          <Undo2 size={16} />
        </Button>
    )
  );

  const UserAvatarComponent = ({ className }: { className?: string }) => (
    chatType === 'group' ? (
      <Avatar className={cn("h-8 w-8 shrink-0 self-start", className)}>
        <AvatarImage src={senderAvatarUrl} alt={senderName} data-ai-hint="person abstract"/>
        <AvatarFallback>{senderInitial}</AvatarFallback>
      </Avatar>
    ) : null
  );

  return (
    <div className={cn("flex w-full items-start group mb-3", isCurrentUserMessage ? "justify-end" : "justify-start")}>
      {isCurrentUserMessage ? (
        <>
          <SenderActionButtons className="order-1 mr-1 self-center" />
          <BubbleContentLayout className="order-2 mr-2">
            {/* Content is rendered inside BubbleContentLayout */}
          </BubbleContentLayout>
          {chatType === 'group' && <UserAvatarComponent className="order-3 self-start ml-0" />}
        </>
      ) : (
        <>
          {chatType === 'group' && <UserAvatarComponent className="mr-2 self-start" />}
          <BubbleContentLayout className="mr-1">
             {/* Content is rendered inside BubbleContentLayout */}
          </BubbleContentLayout>
          <ReceiverActionButton className="ml-1 self-center" />
        </>
      )}
    </div>
  );
}
