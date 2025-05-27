
"use client";

import type { User } from '@/types/chat';
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUserInternal] = useLocalStorage<User | null>('localchat_currentUser', null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false); 
  }, []);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserInternal(user);
  };
  
  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
