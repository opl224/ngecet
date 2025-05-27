
"use client";

import type { User } from '@/types/chat';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const UserProfileModal = ({ user, isOpen, onOpenChange }: UserProfileModalProps) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center pt-6">
          <Avatar className="w-24 h-24 mb-4 border-2 border-primary shadow-lg">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar large person" />
            <AvatarFallback className="text-4xl">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl font-bold">{user.name}</DialogTitle>
          <DialogDescription>
            User Profile
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center">
          {/* Placeholder untuk detail profil lebih lanjut jika diperlukan di masa mendatang */}
          <p className="text-sm text-muted-foreground">
            {/* Ini adalah tempat untuk detail profil tambahan. */}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;
