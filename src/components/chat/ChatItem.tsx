
"use client";

import type { Chat, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
import { User as UserIcon, Users, AlertTriangle, Check, X, ShieldOff, ShieldAlert, Trash2 } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

interface ChatItemProps {
  chat: Chat & { calculatedUnreadCount?: number };
  currentUser: User;
  onSelectChat: (chat: Chat) => void;
  isActive: boolean;
  onAcceptChat: (chatId: string) => void;
  onRejectChat: (chatId: string) => void;
  onDeleteChatPermanently: (chatId: string) => void;
  onUnblockUser: (chatId: string) => void;
  isMobileView: boolean;
}

export function ChatItem({
  chat,
  currentUser,
  onSelectChat,
  isActive,
  onAcceptChat,
  onRejectChat,
  onDeleteChatPermanently,
  onUnblockUser,
  isMobileView,
}: ChatItemProps) {
  const { setOpenMobile } = useSidebar();

  const getChatDisplayDetails = () => {
    let name = "Chat";
    let avatarUrl = chat.avatarUrl;
    let IconComponent: React.ElementType = Users;
    let initials = "?";
    let statusMessage: string | null = null;
    let otherParticipant: User | undefined = undefined;

    if (chat.type === "direct") {
      otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
      name = otherParticipant?.name || "Pengguna Tidak Dikenal";
      avatarUrl = otherParticipant?.avatarUrl || chat.avatarUrl;
      IconComponent = UserIcon;
      initials = otherParticipant?.name?.substring(0, 1).toUpperCase() || name.substring(0,1).toUpperCase() || "?";

      if (chat.pendingApprovalFromUserId === currentUser.id) {
        statusMessage = `Permintaan dari ${name}`;
      } else if (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser.id) {
        statusMessage = "Permintaan terkirim";
      } else if (chat.isRejected) {
         const rejecterName = chat.rejectedByUserId === currentUser.id ? "Anda" : (chat.participants.find(p => p.id === chat.rejectedByUserId)?.name || name);
         const rejectedTargetName = chat.rejectedByUserId === currentUser.id ? name : "Anda";
        statusMessage = `Ditolak oleh ${rejecterName}`;
      } else if (chat.blockedByUser === currentUser.id) {
        statusMessage = `Anda memblokir ${name}`;
      } else if (chat.blockedByUser && chat.blockedByUser !== currentUser.id) {
        statusMessage = `${name} memblokir Anda`;
      }
    } else if (chat.type === "group") {
      name = chat.name || "Grup Tanpa Nama";
      initials = chat.name?.substring(0, 1).toUpperCase() || name.substring(0,1).toUpperCase() || "G";
      IconComponent = Users;
    }
     if (initials.length > 2) initials = initials.substring(0,1);


    return {
      name,
      avatarUrl,
      IconComponent,
      initials,
      statusMessage,
      otherParticipantName: otherParticipant?.name
    };
  };

  const { name, avatarUrl, IconComponent, initials, statusMessage, otherParticipantName } = getChatDisplayDetails();

  const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    try {
      if (isToday(date)) {
        return format(date, "HH:mm", { locale: idLocale });
      }
      if (isYesterday(date)) {
        return "Kemarin";
      }
      return formatDistanceToNowStrict(date, { addSuffix: true, locale: idLocale });
    } catch (e) {
      // Fallback for very old dates if formatDistanceToNowStrict throws error
      return format(date, "dd/MM/yy", { locale: idLocale });
    }
  };

  const unreadCount = chat.calculatedUnreadCount || 0;
  const displayTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;

  const handleItemClick = () => {
    onSelectChat(chat);
    if (isMobileView) {
      setOpenMobile(false);
    }
  };

  const showActions = chat.type === 'direct' &&
                      (chat.pendingApprovalFromUserId === currentUser.id ||
                       (chat.isRejected && chat.rejectedByUserId !== currentUser.id) ||
                       (chat.blockedByUser === currentUser.id));


  const messageOrStatusToDisplay = statusMessage || "";


  return (
    <div
      onClick={!showActions ? handleItemClick : undefined} // Allow click on whole item if no specific actions are shown
      className={cn(
        "flex items-center p-2.5 rounded-lg cursor-pointer transition-colors",
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
        showActions && "cursor-default" // Reset cursor if actions are present
      )}
    >
      <Avatar className="h-12 w-12 mr-3 shrink-0">
        <AvatarImage src={avatarUrl} alt={name} data-ai-hint={chat.type === 'group' ? 'group abstract' : 'person abstract'} />
        <AvatarFallback>
          {initials !== "?" ? initials : <IconComponent className="h-5 w-5 text-muted-foreground" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate text-sidebar-foreground">
              {name}
            </h4>
          </div>
          {displayTimestamp && (
            <span className={cn(
              "text-xs shrink-0 ml-2",
              isActive ? "text-sidebar-accent-foreground/80" : "text-sidebar-foreground/60"
            )}>
              {formatTimestamp(displayTimestamp)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-start mt-0.5">
          <p className={cn(
            "text-xs truncate",
            statusMessage && chat.pendingApprovalFromUserId === currentUser.id ? "text-amber-600 dark:text-amber-500 font-medium" :
            statusMessage && (chat.isRejected || chat.blockedByUser) ? "text-destructive font-medium" :
            isActive ? "text-sidebar-accent-foreground/90" : "text-sidebar-foreground/70"
          )}>
            {messageOrStatusToDisplay}
          </p>
          {unreadCount > 0 && !statusMessage && (
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={cn(
                "ml-2 px-2 py-0.5 text-xs h-5 min-w-[20px] flex items-center justify-center shrink-0",
                 isActive ? "bg-primary text-primary-foreground" : "bg-sidebar-primary text-sidebar-primary-foreground"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </div>

        {showActions && (
          <div className="mt-2 flex space-x-2">
            {chat.pendingApprovalFromUserId === currentUser.id && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-8 border-green-500 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                  onClick={(e) => { e.stopPropagation(); onAcceptChat(chat.id); }}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Terima
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-8 border-destructive text-destructive hover:bg-destructive/10"
                  onClick={(e) => { e.stopPropagation(); onRejectChat(chat.id); }}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" /> Tolak
                </Button>
              </>
            )}
            {chat.isRejected && chat.rejectedByUserId !== currentUser.id && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs h-8"
                  onClick={(e) => { e.stopPropagation(); onDeleteChatPermanently(chat.id); }}
                >
                 <Trash2 className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Hapus Chat
                </Button>
            )}
             {chat.blockedByUser === currentUser.id && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs h-8 text-green-600 border-green-500 hover:bg-green-500/10 hover:text-green-700"
                  onClick={(e) => { e.stopPropagation(); onUnblockUser(chat.id); }}
                >
                  <ShieldOff className="mr-1.5 h-3.5 w-3.5" /> Buka Blokir
                </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

    