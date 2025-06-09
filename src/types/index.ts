
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

// Status related types
export type StatusType = 'text' | 'image'; // For future use

export interface UserStatus {
  id: string; // Unique ID for the status
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  type: StatusType;
  content: string; // For text status, this is the text. For image, could be URL.
  backgroundColorName?: string; // For text status, e.g., 'Mustard'
  timestamp: number;
  // impressions?: User[]; // Who has seen this status (future)
  // duration?: number; // Default 24 hours (future)
}

// Type for storing read status timestamps
// Structure: { [viewerId: string]: { [statusAuthorId: string]: lastStatusTimestampRead } }
export type ReadStatusTimestamps = Record<string, Record<string, number>>;
