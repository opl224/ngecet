
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserIcon } from 'lucide-react';

const UserSetupForm = () => {
  const { setCurrentUser } = useAuth();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const newUser = {
        id: crypto.randomUUID(),
        name: name.trim(),
        avatarUrl: `https://placehold.co/40x40/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=${name.charAt(0).toUpperCase()}`
      };
      setCurrentUser(newUser);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <UserIcon className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to LocalChat!</CardTitle>
          <CardDescription>Please enter your name to join the chat.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 text-lg"
                aria-label="Your Name"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg" disabled={!name.trim()}>
              Join Chat
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSetupForm;
