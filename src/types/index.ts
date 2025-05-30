
export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  status?: string;
}

export interface Message {
  id:string;
  chatId: string;
  senderId: string;
  senderName: string; // Denormalized for easier display
  content: string;
  timestamp: number;
  isEdited?: boolean; // To track if a message was edited
  replyToMessageId?: string;
  replyToMessageSenderName?: string;
  replyToMessageContent?: string;
}

export type ChatType = "direct" | "group";

export interface Chat {
  id: string;
  type: ChatType;
  name?: string; // For group chats or direct chat partner name
  participants: User[];
  lastMessage?: string;
  lastMessageTimestamp?: number;
  avatarUrl?: string; // For group chats or direct chat partner avatar

  pendingApprovalFromUserId?: string;
  isRejected?: boolean;
  rejectedByUserId?: string;
  requestTimestamp?: number;

  lastReadBy: Record<string, number>;
  clearedTimestamp: Record<string, number>;
  createdByUserId?: string;
  blockedByUser?: string; // ID of the user who initiated the block
}

// New type for registered user data stored in localStorage
export interface RegisteredUser {
  username: string; // This will be unique and used for login
  password: string; // For mock auth, plain text (NOT SECURE FOR PRODUCTION)
  profile: User;    // The User object associated with this registration
  email: string; // Added email field
}
