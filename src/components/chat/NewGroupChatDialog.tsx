
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useMemo } from "react";
import type { User, Chat } from "@/types"; 
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
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"; 

const groupChatFormSchema = z.object({
  groupName: z.string().min(2, "Nama grup minimal 2 karakter.").max(30, "Nama grup terlalu panjang."),
});

type GroupChatFormValues = z.infer<typeof groupChatFormSchema>;

interface NewGroupChatDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateChat: (groupName: string, memberNames: string[]) => void;
  currentUserId: string | undefined;
  chats: Chat[]; 
  currentUserObj: User | null; 
  initialMemberName?: string | null;
}

export function NewGroupChatDialog({ 
    isOpen, 
    onOpenChange, 
    onCreateChat, 
    currentUserId, 
    chats, 
    currentUserObj, 
    initialMemberName 
}: NewGroupChatDialogProps) {
  const { toast } = useToast();
  const [currentMemberNameInput, setCurrentMemberNameInput] = useState('');
  const [addedMembers, setAddedMembers] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMemberInputFocused, setIsMemberInputFocused] = useState(false);


  const form = useForm<GroupChatFormValues>({
    resolver: zodResolver(groupChatFormSchema),
    defaultValues: { groupName: "" },
  });

  useEffect(() => {
    if (isOpen && initialMemberName && !addedMembers.includes(initialMemberName)) {
        // Validate if initialMemberName can be added (is an active contact)
        const isActiveContact = activeDirectContacts.some(contact => contact.name.toLowerCase() === initialMemberName.toLowerCase());
        if (isActiveContact) {
            setAddedMembers(prev => [...prev, initialMemberName]);
        } else if (currentUserObj?.name.toLowerCase() !== initialMemberName.toLowerCase()) {
            // Only toast if it's not the current user and not an active contact
            toast({
                title: "Info Tambahan",
                description: `Pengguna "${initialMemberName}" tidak dapat ditambahkan secara otomatis karena tidak ada chat langsung aktif. Anda bisa menambahkannya secara manual jika memenuhi syarat.`,
                variant: "default"
            });
        }
    }
    if (!isOpen) { // Reset when dialog closes
        setAddedMembers([]);
        setCurrentMemberNameInput('');
        setShowSuggestions(false);
        setIsMemberInputFocused(false);
        form.reset({ groupName: "" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMemberName, currentUserObj]); // activeDirectContacts is not needed here as it might cause loop


  const activeDirectContacts = useMemo(() => {
    if (!currentUserId || !chats) return [];
    const contacts: User[] = [];
    chats.forEach(chat => {
      if (chat.type === 'direct' && !chat.pendingApprovalFromUserId && !chat.isRejected) {
        const otherParticipant = chat.participants.find(p => p.id !== currentUserId);
        if (otherParticipant) {
          contacts.push(otherParticipant);
        }
      }
    });
    return contacts.filter((contact, index, self) =>
      index === self.findIndex((c) => c.id === contact.id) 
    );
  }, [chats, currentUserId]);

  useEffect(() => {
    const currentInput = currentMemberNameInput.trim();
    if (currentInput === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filteredSuggestions = activeDirectContacts
      .filter(contact =>
        contact.name.toLowerCase().includes(currentInput.toLowerCase()) &&
        !addedMembers.map(am => am.toLowerCase()).includes(contact.name.toLowerCase())
      );

    setSuggestions(filteredSuggestions);
    setShowSuggestions(filteredSuggestions.length > 0);

  }, [currentMemberNameInput, activeDirectContacts, addedMembers]);


  const handleAddMemberToList = (nameFromInput?: string) => {
    const nameToAdd = (nameFromInput || currentMemberNameInput).trim();

    if (!nameToAdd) return;

    if (currentUserObj && nameToAdd.toLowerCase() === currentUserObj.name.toLowerCase()) {
      toast({ title: "Info", description: "Anda otomatis termasuk dalam grup." });
      setCurrentMemberNameInput('');
      setShowSuggestions(false);
      return;
    }

    if (addedMembers.map(m => m.toLowerCase()).includes(nameToAdd.toLowerCase())) {
      toast({ title: "Info", description: `${nameToAdd} sudah ditambahkan.` });
      setCurrentMemberNameInput('');
      setShowSuggestions(false);
      return;
    }
    
    if (!/^[a-zA-Z0-9\s_']+$/.test(nameToAdd) || nameToAdd.length < 2 || nameToAdd.length > 50) {
        toast({ title: "Nama Tidak Valid", description: "Nama anggota harus antara 2 dan 50 karakter, dan hanya boleh berisi huruf, angka, spasi, garis bawah, dan apostrof.", variant: "destructive" });
        return;
    }

    const isActiveContact = activeDirectContacts.some(contact => contact.name.toLowerCase() === nameToAdd.toLowerCase());
    if (!isActiveContact) {
        toast({
            title: "Penambahan Gagal",
            description: `Tidak dapat menambahkan ${nameToAdd}. Anda harus memiliki chat langsung yang aktif dengan pengguna ini.`,
            variant: "destructive",
        });
        return;
    }

    setAddedMembers([...addedMembers, nameToAdd]);
    setCurrentMemberNameInput('');
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (suggestedUser: User) => {
     if (addedMembers.map(m => m.toLowerCase()).includes(suggestedUser.name.toLowerCase())) {
      toast({ title: "Info", description: `${suggestedUser.name} sudah ditambahkan.` });
      setCurrentMemberNameInput('');
      setShowSuggestions(false);
      setIsMemberInputFocused(false);
      return;
    }
    setAddedMembers([...addedMembers, suggestedUser.name]);
    setCurrentMemberNameInput('');
    setShowSuggestions(false);
    setIsMemberInputFocused(false);
  };

  const handleRemoveMemberFromList = (nameToRemove: string) => {
    setAddedMembers(addedMembers.filter(name => name !== nameToRemove));
  };

  function onSubmit(data: GroupChatFormValues) {
    if (addedMembers.length === 0) {
      toast({ title: "Anggota Diperlukan", description: "Harap tambahkan minimal satu anggota yang valid.", variant: "destructive" });
      return;
    }
    onCreateChat(data.groupName, addedMembers);
    // Reset is handled by useEffect on isOpen changing to false
    onOpenChange(false);
  }
  

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        // if (!open) { // Reset logic moved to useEffect for better coordination with initialMemberName
        //     form.reset({ groupName: "" });
        //     setAddedMembers([]);
        //     setCurrentMemberNameInput('');
        //     setShowSuggestions(false);
        //     setIsMemberInputFocused(false);
        // }
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Grup Chat Baru</DialogTitle>
          <DialogDescription>
            Buat grup chat baru dengan beberapa pengguna. Anda hanya bisa menambahkan pengguna yang sudah memiliki chat langsung aktif dengan Anda.
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
                    <Input placeholder="e.g., Tim Proyek" {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>Tambah Anggota</FormLabel>
              <Popover open={isMemberInputFocused && showSuggestions && suggestions.length > 0} onOpenChange={(open) => {
                  // Popover visibility managed by focus and suggestions state
              }}>
                <PopoverAnchor asChild>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Ketik nama pengguna..."
                        value={currentMemberNameInput}
                        onChange={(e) => setCurrentMemberNameInput(e.target.value)}
                        onFocus={() => {
                            setIsMemberInputFocused(true);
                            const currentInputVal = currentMemberNameInput.trim();
                            if (currentInputVal === "") {
                                setShowSuggestions(false);
                                setSuggestions([]);
                            } else {
                                const filtered = activeDirectContacts.filter(contact =>
                                  contact.name.toLowerCase().includes(currentInputVal.toLowerCase()) &&
                                  !addedMembers.map(am => am.toLowerCase()).includes(contact.name.toLowerCase())
                                );
                                setSuggestions(filtered);
                                setShowSuggestions(filtered.length > 0);
                            }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddMemberToList();
                          }
                           if (e.key === 'Escape') {
                               setShowSuggestions(false);
                               setIsMemberInputFocused(false);
                               (e.target as HTMLElement).blur();
                           }
                        }}
                      />
                      <Button type="button" onClick={() => handleAddMemberToList()} size="icon" aria-label="Tambah anggota">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                </PopoverAnchor>
                <PopoverContent 
                    className="w-[calc(theme(space.96)-theme(space.12))] p-0" 
                    side="bottom" 
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onInteractOutside={() => {
                        setIsMemberInputFocused(false);
                    }}
                >
                  <ScrollArea className="max-h-40">
                    {suggestions.length > 0 ? (
                      <div className="py-1">
                        {suggestions.map(user => (
                          <div
                            key={user.id}
                            className="px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                            onClick={() => handleSelectSuggestion(user)}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {user.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                       currentMemberNameInput.trim() !== "" && <p className="p-3 text-sm text-muted-foreground">Pengguna tidak ditemukan, belum punya chat aktif, atau sudah ditambahkan.</p>
                    )}
                    {activeDirectContacts.length === 0 && currentMemberNameInput.trim() === "" && <p className="p-3 text-sm text-muted-foreground">Tidak ada kontak aktif untuk disarankan.</p>}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
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
             {addedMembers.length === 0 && (
                 <p className="text-xs text-muted-foreground pt-1">Belum ada anggota yang ditambahkan (selain diri Anda).</p>
             )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => {
                  // Reset logic is now mainly in useEffect on isOpen
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
