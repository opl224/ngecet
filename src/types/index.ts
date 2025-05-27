
export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  status?: string; // Ditambahkan field status
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string; // Denormalized for easier display
  content: string;
  timestamp: number;
}

export type ChatType = "direct" | "group";

export interface Chat {
  id: string;
  type: ChatType;
  name?: string; // For group chats
  participants: string[]; // Array of user IDs
  lastMessage?: string;
  lastMessageTimestamp?: number;
  unreadCount?: number; // Optional: for future unread messages feature
  avatarUrl?: string; // For group chats or direct chat partner
}
