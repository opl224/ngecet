
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import type { User } from "@/types"; // Chat type is not needed here anymore
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

const groupChatFormSchema = z.object({
  groupName: z.string().min(2, "Nama grup minimal 2 karakter.").max(30, "Nama grup terlalu panjang."),
});

type GroupChatFormValues = z.infer<typeof groupChatFormSchema>;

interface NewGroupChatDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateChat: (groupName: string, memberNames: string[]) => void;
  currentUserObj: User | null;
  initialMemberName?: string | null;
}

export function NewGroupChatDialog({
    isOpen,
    onOpenChange,
    onCreateChat,
    currentUserObj,
    initialMemberName
}: NewGroupChatDialogProps) {
  const { toast } = useToast();
  const [currentMemberNameInput, setCurrentMemberNameInput] = useState('');
  const [addedMembers, setAddedMembers] = useState<string[]>([]);

  const form = useForm<GroupChatFormValues>({
    resolver: zodResolver(groupChatFormSchema),
    defaultValues: { groupName: "" },
  });

  useEffect(() => {
    if (isOpen && initialMemberName && !addedMembers.map(m => m.toLowerCase()).includes(initialMemberName.toLowerCase())) {
        // We won't validate against activeDirectContacts here anymore.
        // The validation will be fully handled by page.tsx's handleCreateGroupChat
        if (currentUserObj?.name.toLowerCase() !== initialMemberName.toLowerCase()) {
            setAddedMembers(prev => [...new Set([...prev, initialMemberName])]);
        }
    }
    if (!isOpen) {
        form.reset({ groupName: "" });
        setAddedMembers([]);
        setCurrentMemberNameInput('');
    }
  }, [isOpen, initialMemberName, currentUserObj, form]); // addedMembers removed from deps as it's set inside

  const handleAddMemberToList = () => {
    const nameToAdd = currentMemberNameInput.trim();

    if (!nameToAdd) return;

    if (currentUserObj && nameToAdd.toLowerCase() === currentUserObj.name.toLowerCase()) {
      toast({ title: "Info", description: "Anda otomatis termasuk dalam grup." });
      setCurrentMemberNameInput('');
      return;
    }

    if (addedMembers.map(m => m.toLowerCase()).includes(nameToAdd.toLowerCase())) {
      toast({ title: "Info", description: `${nameToAdd} sudah ditambahkan.` });
      setCurrentMemberNameInput('');
      return;
    }
    
    if (!/^[a-zA-Z0-9\s_']+$/.test(nameToAdd) || nameToAdd.length < 2 || nameToAdd.length > 50) {
        toast({ title: "Nama Tidak Valid", description: "Nama anggota harus antara 2 dan 50 karakter, dan hanya boleh berisi huruf, angka, spasi, garis bawah, dan apostrof.", variant: "destructive" });
        return;
    }

    setAddedMembers([...addedMembers, nameToAdd]);
    setCurrentMemberNameInput('');
  };

  const handleRemoveMemberFromList = (nameToRemove: string) => {
    setAddedMembers(addedMembers.filter(name => name !== nameToRemove));
  };

  function onSubmit(data: GroupChatFormValues) {
    if (addedMembers.length === 0 && (!initialMemberName || !addedMembers.includes(initialMemberName))) {
      toast({ title: "Anggota Diperlukan", description: "Harap tambahkan minimal satu anggota lain.", variant: "destructive" });
      return;
    }
    // Pass only the display names; page.tsx will handle User object creation and validation
    onCreateChat(data.groupName, addedMembers);
    onOpenChange(false); // This will trigger the useEffect to reset states
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Grup Chat Baru</DialogTitle>
          <DialogDescription>
            Buat grup chat baru. Pastikan Anda sudah memiliki chat aktif dengan anggota yang ingin ditambahkan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="groupName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Grup</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama grup" {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Tambah Anggota</FormLabel>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ketik nama pengguna..."
                    value={currentMemberNameInput}
                    onChange={(e) => setCurrentMemberNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddMemberToList();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddMemberToList} size="icon" aria-label="Tambah anggota">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
            </FormItem>

            {addedMembers.length > 0 && (
              <FormItem className="mt-3">
                <FormLabel>Anggota yang akan ditambahkan:</FormLabel>
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
                        aria-label={`Hapus ${name}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </FormItem>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => {
                  onOpenChange(false);
                }}>Batal</Button>
              <Button type="submit">Buat Grup</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
