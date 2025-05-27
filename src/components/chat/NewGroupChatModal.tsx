
"use client";

import React, { useState, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import type { User } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NewGroupChatModal = () => {
  const { users: allUsers, createGroupChat } = useChat(); // `users` in context already excludes current user
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  const availableUsers = allUsers; // Users from ChatContext are already filtered

  const handleUserSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (groupName.trim() && selectedUserIds.length > 0 && currentUser) {
      await createGroupChat(groupName, selectedUserIds);
      setIsOpen(false);
      setGroupName('');
      setSelectedUserIds([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <PlusCircle className="h-5 w-5" /> Create Group Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Group Chat</DialogTitle>
          <DialogDescription>
            Select members and give your group a name.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="groupName" className="text-right">
              Group Name
            </Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="col-span-3"
              placeholder="My Awesome Group"
            />
          </div>
          <div className="space-y-2">
            <Label>Select Members</Label>
            <ScrollArea className="h-[200px] w-full rounded-md border p-2">
              {availableUsers.length === 0 && <p className="text-sm text-muted-foreground p-2">No other users available to add.</p>}
              {availableUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={() => handleUserSelect(user.id)}
                  />
                  <Label htmlFor={`user-${user.id}`} className="font-normal cursor-pointer flex-1">
                    {user.name}
                  </Label>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!groupName.trim() || selectedUserIds.length === 0}>
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroupChatModal;
