
export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  status?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string; // Denormalized for easier display
  content: string;
  timestamp: number;
  isEdited?: boolean; // To track if a message was edited
}

export type ChatType = "direct" | "group";

export interface Chat {
  id: string;
  type: ChatType;
  name?: string; // For group chats
  participants: User[]; // Array of user objects or just IDs if fetched separately
  lastMessage?: string;
  lastMessageTimestamp?: number;
  unreadCount?: number; // Optional: for future unread messages feature
  avatarUrl?: string; // For group chats or direct chat partner
}
