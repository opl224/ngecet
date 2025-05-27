
export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string; // Group name or other user's name for direct chat
  participantIds: string[];
  lastMessage?: Message;
  // unreadCount could be added here if needed for current user
  avatarUrl?: string; // For group chats
}
