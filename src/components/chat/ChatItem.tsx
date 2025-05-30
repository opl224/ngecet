
"use client";

import type { Chat, User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from 'date-fns';
import { id as idLocale } from 'date-fns/locale/id';
import { Users, User as UserIcon, Check, X, Trash2, ShieldAlert, Clock, ShieldOff } from "lucide-react";
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
}: ChatItemProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  const getChatDisplayDetails = () => {
    if (chat.type === "direct") {
      const otherParticipant = chat.participants.find(p => typeof p === 'object' && p.id !== currentUser.id);
      const nameForDisplay = otherParticipant?.name || ""; // Fallback to empty string if name is not found
      const avatarForDisplay = otherParticipant?.avatarUrl || chat.avatarUrl;
      const initials = (nameForDisplay ? nameForDisplay.substring(0, 2) : "??").toUpperCase();
      return { name: nameForDisplay, avatarUrl: avatarForDisplay, initials, Icon: UserIcon, otherParticipantStatus: otherParticipant?.status };
    } else {
      const groupName = chat.name || "Unnamed Group";
      return {
        name: groupName,
        avatarUrl: chat.avatarUrl,
        initials: (groupName.substring(0, 2) || "GR").toUpperCase(),
        Icon: Users,
        otherParticipantStatus: null,
      };
    }
  };

  const { name, avatarUrl, initials, Icon, otherParticipantStatus } = getChatDisplayDetails();

  let statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
  let showAcceptRejectActions = false;
  let showDeleteActionForRejected = false;
  let specialStatusText: string | null = null;
  const calculatedUnreadCount = chat.calculatedUnreadCount || 0;
  let showPendingClockIcon = false;

  if (chat.type === "direct") {
    if (chat.blockedByUser === currentUser.id) {
        const otherUserName = chat.participants.find(p => p.id !== currentUser.id)?.name || "pengguna ini";
        specialStatusText = null; // No subtext, icon will indicate block
        statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
    } else if (chat.blockedByUser && chat.blockedByUser !== currentUser.id) {
        specialStatusText = `${name} mungkin memblokir Anda.`;
        statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
    } else if (chat.pendingApprovalFromUserId === currentUser.id) {
      statusTimestamp = chat.requestTimestamp;
      showAcceptRejectActions = true;
      specialStatusText = "Permintaan chat baru";
    } else if (chat.pendingApprovalFromUserId) { // Request sent by current user, pending for other
      showPendingClockIcon = true;
      statusTimestamp = chat.requestTimestamp;
      // specialStatusText = "Permintaan dikirim. Menunggu..."; // Removed as per request
    } else if (chat.isRejected) {
      if (chat.rejectedByUserId !== currentUser.id) {
        specialStatusText = `${name} menolak permintaan Anda.`;
      } else {
        specialStatusText = null; // "Anda menolak permintaan ini." removed. Icon will be shown.
      }
      statusTimestamp = chat.lastMessageTimestamp || chat.requestTimestamp;
      showDeleteActionForRejected = true;
    }
  }

  const isClickDisabled =
    (chat.pendingApprovalFromUserId && chat.pendingApprovalFromUserId !== currentUser.id && !isActive && !showAcceptRejectActions) ||
    (chat.type === 'direct' && chat.blockedByUser && chat.blockedByUser !== currentUser.id && !isActive);


  const handleItemClick = () => {
    if (isClickDisabled && !showAcceptRejectActions) return;
    onSelectChat(chat);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isItemActiveInList = isActive &&
    !chat.pendingApprovalFromUserId &&
    !chat.isRejected &&
    !(chat.type === 'direct' && chat.blockedByUser);


  let statusMessageToDisplay: React.ReactNode = null;
  if (specialStatusText) {
    statusMessageToDisplay = specialStatusText;
  } else if (showPendingClockIcon && !chat.isRejected) {
    // No status message needed if clock icon is shown for pending sent requests
  } else if (chat.type === "group" && !chat.lastMessage && !chat.pendingApprovalFromUserId && !chat.isRejected) {
     statusMessageToDisplay = `${chat.participants.length} anggota`;
  } else if (chat.type === "direct" && !chat.lastMessage && !chat.pendingApprovalFromUserId && !chat.isRejected && !chat.blockedByUser) {
     statusMessageToDisplay = "Mulai percakapan";
  }
  // else if (chat.lastMessage && !specialStatusText && !showPendingClockIcon) { // Removed: "Aktivitas terakhir"
  //    statusMessageToDisplay = chat.type === 'direct' ? "Aktivitas terakhir" : "Aktivitas grup terakhir";
  // }

  return (
    <div
      onClick={handleItemClick}
      className={cn(
        "w-full text-left p-3 flex flex-col rounded-lg hover:bg-sidebar-accent transition-colors",
        isItemActiveInList ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
        isClickDisabled && !showAcceptRejectActions && "opacity-70 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
            "w-full flex items-center space-x-3",
            (!isClickDisabled || showAcceptRejectActions) && "cursor-pointer" // Make clickable if actions are present
        )}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt={name || 'Chat Avatar'} data-ai-hint={chat.type === 'group' ? 'group people' : 'person abstract'}/>
          <AvatarFallback>
            {initials || <Icon className="h-5 w-5 text-sidebar-foreground/70" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 overflow-hidden"> {/* Added overflow-hidden here */}
          <div className="flex justify-between items-center">
            <div className="flex items-center min-w-0"> {/* Added min-w-0 here for truncate */}
              {showPendingClockIcon && !chat.isRejected && (
                <Clock className="h-4 w-4 mr-1.5 text-sidebar-foreground/70 shrink-0" />
              )}
              <h4 className={cn(
                  "font-semibold text-sm truncate", // Added truncate class
                  chat.pendingApprovalFromUserId === currentUser.id && "text-primary",
                  (chat.type === 'direct' && chat.isRejected) && "text-destructive",
                  (chat.type === 'direct' && chat.blockedByUser === currentUser.id) && "text-destructive flex items-center"
                )}
              >
                {(chat.type === 'direct' && chat.blockedByUser === currentUser.id) && <ShieldAlert className="h-4 w-4 mr-1.5 shrink-0" />}
                {name}
              </h4>
            </div>
            {(() => {
              if (showAcceptRejectActions) {
                return (
                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); onRejectChat(chat.id); }}
                      className="h-7 w-7 p-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Tolak Permintaan"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); onAcceptChat(chat.id); }}
                      className="h-7 w-7 p-1 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                      aria-label="Terima Permintaan"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                );
              }
              if (showDeleteActionForRejected) {
                 return (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onDeleteChatPermanently(chat.id); }}
                    className="h-7 w-7 p-1 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 ml-2"
                    aria-label="Hapus Chat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                );
              }
              if (chat.type === 'direct' && chat.blockedByUser === currentUser.id && onUnblockUser) {
                // This button is now handled in ChatView, keeping this path minimal
                 return null; // No specific button here, status handled by icon in name
              }
              if (!specialStatusText && calculatedUnreadCount > 0) {
                return (
                  <Badge variant="default" className="h-5 px-1.5 text-xs shrink-0 ml-2">
                    {calculatedUnreadCount > 9 ? '9+' : calculatedUnreadCount}
                  </Badge>
                );
              }
              if (statusTimestamp && !specialStatusText) {
                 if (chat.type === 'direct' && !chat.blockedByUser && !showAcceptRejectActions && !showPendingClockIcon && !chat.isRejected && calculatedUnreadCount === 0) {
                    const status = otherParticipantStatus || "Offline";
                    const isOnline = status === "Online";
                    return (
                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                        <span className={cn(
                          "h-2 w-2 rounded-full block",
                          isOnline ? "bg-green-500" : "bg-sidebar-foreground/30"
                        )}></span>
                        <span className="text-xs text-sidebar-foreground/70">{status}</span>
                      </div>
                    );
                 }
                 if (chat.type === 'group' || (showPendingClockIcon && chat.type === 'direct' && !chat.isRejected) || (chat.type === 'direct' && !chat.isRejected && !chat.pendingApprovalFromUserId && !chat.blockedByUser && calculatedUnreadCount === 0)) {
                     return (
                        <span className="text-xs text-sidebar-foreground/60 shrink-0 ml-2">
                          {formatDistanceToNowStrict(new Date(statusTimestamp), { locale: idLocale, addSuffix: true })}
                        </span>
                      );
                 }
              }
              return null;
            })()}
          </div>
          {statusMessageToDisplay && (
            <p className="text-xs text-sidebar-foreground/70 truncate overflow-hidden">
              {statusMessageToDisplay}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
