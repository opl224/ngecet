
"use client";

import type { UserStatus, RegisteredUser, User } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface SeenByListDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  statusForDialog: UserStatus | null;
  registeredUsers: RegisteredUser[];
}

export function SeenByListDialog({
  isOpen,
  onOpenChange,
  statusForDialog,
  registeredUsers,
}: SeenByListDialogProps) {

  const getInitials = (name: string | undefined, length: number = 1) => {
    if (!name) return "?";
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, length).toUpperCase();
    if (length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + (names.length > 1 ? names[names.length - 1][0].toUpperCase() : "");
  };

  const viewers = useMemo(() => {
    if (!statusForDialog || !statusForDialog.seenBy) {
      return [];
    }
    return statusForDialog.seenBy
      .map(viewerId => {
        const registeredViewer = registeredUsers.find(ru => ru.profile.id === viewerId);
        return registeredViewer ? registeredViewer.profile : null;
      })
      .filter(Boolean) as User[];
  }, [statusForDialog, registeredUsers]);

  if (!statusForDialog) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dilihat oleh</DialogTitle>
          {viewers.length === 0 && (
            <DialogDescription className="pt-4 text-center">
              Belum ada yang melihat status ini.
            </DialogDescription>
          )}
        </DialogHeader>
        {viewers.length > 0 && (
          <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="space-y-3 py-4">
              {viewers.map(viewer => (
                <div key={viewer.id} className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={viewer.avatarUrl} alt={viewer.name} data-ai-hint="person abstract"/>
                    <AvatarFallback>{getInitials(viewer.name, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{viewer.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
