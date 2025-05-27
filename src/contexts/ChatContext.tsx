
"use client";

import type { User, Message, Chat } from '@/types/chat';
import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import useLocalStorage from '@/hooks/use-local-storage';
import { suggestReplies, type SuggestRepliesInput } from '@/ai/flows/suggest-replies';

const LS_USERS_KEY = 'localchat_users';
const LS_CHATS_KEY = 'localchat_chats';
const LS_MESSAGES_KEY = 'localchat_messages';

interface ChatContextType {
  users: User[];
  chats: Chat[];
  activeChatId: string | null;
  setActiveChatId: (chatId: string | null) => void;
  activeChat: Chat | null;
  activeChatMessages: Message[];
  isLoading: boolean;
  
  sendMessage: (text: string) => Promise<void>;
  createDirectChat: (targetUserId: string) => Promise<Chat | null>;
  createGroupChat: (name: string, participantIds: string[]) => Promise<Chat | null>;
  getSmartReplies: (conversationHistoryText: string, userMessageText: string) => Promise<string[]>;
  getUsersByIds: (ids: string[]) => User[];
  getUserById: (id: string) => User | undefined;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const generateId = () => crypto.randomUUID();

// Dummy users for initial setup
const initialUsers: User[] = [
  { id: 'user1', name: 'Alice', avatarUrl: 'https://placehold.co/40x40/E6A9A9/FFFFFF?text=A' },
  { id: 'user2', name: 'Bob', avatarUrl: 'https://placehold.co/40x40/A9E6A9/FFFFFF?text=B' },
  { id: 'user3', name: 'Charlie', avatarUrl: 'https://placehold.co/40x40/A9A9E6/FFFFFF?text=C' },
];

const EMPTY_CHATS_ARRAY: Chat[] = [];
const EMPTY_MESSAGES_ARRAY: Message[] = [];


export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useLocalStorage<User[]>(LS_USERS_KEY, initialUsers);
  const [chats, setChats] = useLocalStorage<Chat[]>(LS_CHATS_KEY, EMPTY_CHATS_ARRAY);
  const [messages, setMessages] = useLocalStorage<Message[]>(LS_MESSAGES_KEY, EMPTY_MESSAGES_ARRAY);
  
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure current user is in the users list
    if (currentUser && !users.find(u => u.id === currentUser.id)) {
      setUsers(prevUsers => [...prevUsers, currentUser]);
    }
    setIsLoading(false);
  }, [currentUser, users, setUsers]);


  const setActiveChatId = useCallback((chatId: string | null) => {
    setActiveChatIdState(chatId);
  }, []); // setActiveChatIdState from useState is stable

  const activeChat = React.useMemo(() => {
    return chats.find(chat => chat.id === activeChatId) || null;
  }, [chats, activeChatId]);

  const activeChatMessages = React.useMemo(() => {
    if (!activeChatId) return [];
    return messages
      .filter(msg => msg.chatId === activeChatId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, activeChatId]);

  const getUsersByIds = useCallback((ids: string[]): User[] => {
    return users.filter(user => ids.includes(user.id));
  }, [users]);

  const getUserById = useCallback((id: string): User | undefined => {
    return users.find(user => user.id === id);
  }, [users]);


  const sendMessage = useCallback(async (text: string) => {
    if (!currentUser || !activeChatId || !text.trim()) return;

    const newMessage: Message = {
      id: generateId(),
      chatId: activeChatId,
      senderId: currentUser.id,
      text: text.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMessage]);
    setChats(prevChats => prevChats.map(chat => 
      chat.id === activeChatId ? { ...chat, lastMessage: newMessage } : chat
    ));
  }, [currentUser, activeChatId, setMessages, setChats]);

  const createDirectChat = useCallback(async (targetUserId: string): Promise<Chat | null> => {
    if (!currentUser || currentUser.id === targetUserId) return null;

    const existingChat = chats.find(chat => 
      chat.type === 'direct' &&
      chat.participantIds.length === 2 &&
      chat.participantIds.includes(currentUser.id) &&
      chat.participantIds.includes(targetUserId)
    );

    if (existingChat) {
      setActiveChatId(existingChat.id); // setActiveChatId is now stable
      return existingChat;
    }
    
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return null;

    const newChat: Chat = {
      id: generateId(),
      type: 'direct',
      participantIds: [currentUser.id, targetUserId].sort(), 
      name: targetUser.name, 
      avatarUrl: targetUser.avatarUrl,
    };
    setChats(prev => [...prev, newChat]);
    setActiveChatId(newChat.id); // setActiveChatId is now stable
    return newChat;
  }, [currentUser, chats, users, setChats, setActiveChatId]);

  const createGroupChat = useCallback(async (name: string, participantIds: string[]): Promise<Chat | null> => {
    if (!currentUser || !name.trim() || participantIds.length === 0) return null;

    const allParticipantIds = Array.from(new Set([currentUser.id, ...participantIds]));
    if (allParticipantIds.length < 2) return null; 

    const newChat: Chat = {
      id: generateId(),
      type: 'group',
      name: name.trim(),
      participantIds: allParticipantIds,
      avatarUrl: `https://placehold.co/40x40/cccccc/FFFFFF?text=${name.charAt(0).toUpperCase()}`
    };
    setChats(prev => [...prev, newChat]);
    setActiveChatId(newChat.id); // setActiveChatId is now stable
    return newChat;
  }, [currentUser, setChats, setActiveChatId]);
  
  const getSmartReplies = useCallback(async (conversationHistoryText: string, userMessageText: string): Promise<string[]> => {
    try {
      const input: SuggestRepliesInput = {
        conversationHistory: conversationHistoryText,
        userMessage: userMessageText,
      };
      const result = await suggestReplies(input);
      return result.suggestions;
    } catch (error) {
      console.error("Error fetching smart replies:", error);
      return [];
    }
  }, []); // suggestReplies is an import, stable
  
  const userChats = React.useMemo(() => {
    if (!currentUser) return [];
    return chats
      .filter(chat => chat.participantIds.includes(currentUser.id))
      .map(chat => {
        if (chat.type === 'direct') {
          const otherUserId = chat.participantIds.find(id => id !== currentUser.id);
          const otherUser = users.find(u => u.id === otherUserId);
          return {
            ...chat,
            name: otherUser?.name || 'Direct Message',
            avatarUrl: otherUser?.avatarUrl || 'https://placehold.co/40x40.png',
          };
        }
        return chat;
      })
      .sort((a,b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
  }, [chats, currentUser, users]);


  return (
    <ChatContext.Provider value={{ 
      users: users.filter(u => u.id !== currentUser?.id), 
      chats: userChats, 
      activeChatId, 
      setActiveChatId, // Now stable
      activeChat,
      activeChatMessages,
      isLoading,
      sendMessage,  // Now stable
      createDirectChat, // Now stable
      createGroupChat, // Now stable
      getSmartReplies, // Now stable
      getUsersByIds,
      getUserById
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

