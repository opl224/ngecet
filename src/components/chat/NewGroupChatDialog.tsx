
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react"; // Added useState
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge"; // Added Badge
import { useToast } from "@/hooks/use-toast"; // Added useToast
import { Plus, X } from "lucide-react"; // Added Plus and X icons

// Updated Zod schema: only groupName is managed by react-hook-form for main submission
const groupChatFormSchema = z.object({
  groupName: z.string().min(2, "Group name must be at least 2 characters.").max(30, "Group name is too long."),
});

type GroupChatFormValues = z.infer<typeof groupChatFormSchema>;

interface NewGroupChatDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateChat: (groupName: string, memberNames: string[]) => void;
  currentUserId: string | undefined; // Used to prevent adding self
}

export function NewGroupChatDialog({ isOpen, onOpenChange, onCreateChat, currentUserId }: NewGroupChatDialogProps) {
  const { toast } = useToast();
  const [currentMemberNameInput, setCurrentMemberNameInput] = useState('');
  const [addedMembers, setAddedMembers] = useState<string[]>([]);

  const form = useForm<GroupChatFormValues>({
    resolver: zodResolver(groupChatFormSchema),
    defaultValues: { groupName: "" },
  });

  const handleAddMemberToList = () => {
    const nameToAdd = currentMemberNameInput.trim();
    const currentUserName = currentUser?.name?.trim(); // Assuming currentUser is available or passed if needed for name comparison

    if (!nameToAdd) return;

    if (currentUserId && nameToAdd.toLowerCase() === currentUserId.toLowerCase()) {
      toast({ title: "Info", description: "Anda otomatis termasuk dalam grup." });
      setCurrentMemberNameInput('');
      return;
    }
     // Check against current user's display name if available (and if currentUserId itself is a display name)
    if (currentUserName && nameToAdd.toLowerCase() === currentUserName.toLowerCase()) {
        toast({ title: "Info", description: "Anda otomatis termasuk dalam grup." });
        setCurrentMemberNameInput('');
        return;
    }


    if (addedMembers.map(m => m.toLowerCase()).includes(nameToAdd.toLowerCase())) {
      toast({ title: "Info", description: `${nameToAdd} sudah ditambahkan.` });
      return;
    }
    
    // Basic validation for member name format, similar to other name inputs
    if (!/^[a-zA-Z0-9\s_']+$/.test(nameToAdd)) {
        toast({ title: "Nama Tidak Valid", description: "Nama anggota hanya boleh berisi huruf, angka, spasi, garis bawah, dan apostrof.", variant: "destructive" });
        return;
    }
    if (nameToAdd.length < 2 || nameToAdd.length > 50) {
        toast({ title: "Nama Tidak Valid", description: "Nama anggota harus antara 2 dan 50 karakter.", variant: "destructive" });
        return;
    }


    setAddedMembers([...addedMembers, nameToAdd]);
    setCurrentMemberNameInput(''); // Clear input after adding
  };

  const handleRemoveMemberFromList = (nameToRemove: string) => {
    setAddedMembers(addedMembers.filter(name => name !== nameToRemove));
  };

  function onSubmit(data: GroupChatFormValues) {
    if (addedMembers.length === 0) {
      toast({ title: "Anggota Diperlukan", description: "Harap tambahkan minimal satu anggota.", variant: "destructive" });
      return;
    }
    onCreateChat(data.groupName, addedMembers);
    form.reset({ groupName: "" });
    setAddedMembers([]);
    setCurrentMemberNameInput('');
    onOpenChange(false);
  }
  
  // Get current user object if needed for more complex logic, for now, only currentUserId (string) is used.
  // This part is illustrative if `currentUser` object was passed and needed.
  // For now, `currentUserId` (string) is sufficient for the self-add check.
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('simplicchat_user') || 'null') : null;


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) { // Reset states if dialog is closed externally
            form.reset({ groupName: "" });
            setAddedMembers([]);
            setCurrentMemberNameInput('');
        }
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Group Chat</DialogTitle>
          <DialogDescription>
            Create a new group chat with multiple users.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="groupName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Project Team" {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>Add Members</FormLabel>
              <div className="flex space-x-2">
                <FormControl>
                  <Input
                    placeholder="Enter member name and press Enter or + "
                    value={currentMemberNameInput}
                    onChange={(e) => setCurrentMemberNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddMemberToList();
                      }
                    }}
                  />
                </FormControl>
                <Button type="button" onClick={handleAddMemberToList} size="icon" aria-label="Add member">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </FormItem>

            {addedMembers.length > 0 && (
              <FormItem className="mt-3">
                <FormLabel>Members to be added:</FormLabel>
                <div className="flex flex-wrap gap-2 pt-1">
                  {addedMembers.map(name => (
                    <Badge key={name} variant="secondary" className="flex items-center gap-1 pr-1">
                      <span>{name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0.5 hover:bg-muted-foreground/20 rounded-full"
                        onClick={() => handleRemoveMemberFromList(name)}
                        aria-label={`Remove ${name}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </FormItem>
            )}
             {addedMembers.length === 0 && (
                 <p className="text-xs text-muted-foreground pt-1">No members added yet (besides yourself).</p>
             )}


            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => {
                  form.reset({ groupName: "" });
                  setAddedMembers([]);
                  setCurrentMemberNameInput('');
                  onOpenChange(false); 
                }}>Cancel</Button>
              <Button type="submit">Create Group</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    