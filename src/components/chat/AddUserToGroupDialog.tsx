
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
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

const addUserFormSchema = z.object({
  userName: z.string().min(2, "Nama pengguna minimal 2 karakter.").max(50, "Nama terlalu panjang.").regex(/^[a-zA-Z0-9\s_']+$/, "Nama hanya boleh berisi huruf, angka, spasi, garis bawah, dan apostrof."),
});

type AddUserFormValues = z.infer<typeof addUserFormSchema>;

interface AddUserToGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddUser: (userName: string) => void;
  chats: Chat[];
  currentUserObj: User | null;
}

export function AddUserToGroupDialog({
  isOpen,
  onOpenChange,
  onAddUser,
  chats,
  currentUserObj,
}: AddUserToGroupDialogProps) {
  const { toast } = useToast();
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: { userName: "" },
  });

  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const activeDirectContacts = useMemo(() => {
    if (!currentUserObj || !chats) return [];
    const contacts: User[] = [];
    chats.forEach(chat => {
      if (chat.type === 'direct' && !chat.pendingApprovalFromUserId && !chat.isRejected) {
        const otherParticipant = chat.participants.find(p => p.id !== currentUserObj.id);
        if (otherParticipant) {
          contacts.push(otherParticipant);
        }
      }
    });
    return contacts.filter((contact, index, self) =>
      index === self.findIndex((c) => c.id === contact.id)
    );
  }, [chats, currentUserObj]);

  useEffect(() => {
    const currentInput = form.getValues("userName");
    if (currentInput.trim() === "") {
      setSuggestions([]);
      // Don't hide suggestions immediately if input is focused, allow seeing "no results"
      if (isInputFocused) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
      return;
    }

    const filteredSuggestions = activeDirectContacts.filter(contact =>
      contact.name.toLowerCase().includes(currentInput.toLowerCase())
    );
    setSuggestions(filteredSuggestions);
    setShowSuggestions(true); // Show suggestions if there's input
  }, [form.watch("userName"), activeDirectContacts, form, isInputFocused]);


  function onSubmit(data: AddUserFormValues) {
    if (currentUserObj && data.userName.toLowerCase() === currentUserObj.name.toLowerCase()) {
      toast({ title: "Info", description: "Anda tidak dapat menambahkan diri sendiri.", variant: "default" });
      return;
    }
    onAddUser(data.userName);
    form.reset();
    setShowSuggestions(false);
    onOpenChange(false);
  }

  const handleSelectSuggestion = (suggestedUser: User) => {
    form.setValue("userName", suggestedUser.name, { shouldValidate: true });
    setShowSuggestions(false);
    setIsInputFocused(false); // Lose focus after selection
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
        setShowSuggestions(false);
        setIsInputFocused(false);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna ke Grup</DialogTitle>
          <DialogDescription>
            Masukkan nama pengguna yang ingin Anda tambahkan. Hanya pengguna dengan chat langsung aktif yang akan muncul sebagai saran.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Pengguna</FormLabel>
                  <Popover open={isInputFocused && showSuggestions} onOpenChange={(open) => {
                    // This onOpenChange for Popover might not be needed if we control via isInputFocused and showSuggestions
                    if (!open) {
                        //setShowSuggestions(false); // Handled by onBlur or selection
                    }
                  }}>
                    <PopoverAnchor asChild>
                      <FormControl>
                        <Input
                          placeholder="e.g., Alex Ray"
                          {...field}
                          autoFocus
                          onFocus={() => {
                            setIsInputFocused(true);
                            setShowSuggestions(true); // Show suggestions on focus if input has value
                             if (form.getValues("userName").trim() !== "") {
                                const filtered = activeDirectContacts.filter(contact =>
                                  contact.name.toLowerCase().includes(form.getValues("userName").toLowerCase())
                                );
                                setSuggestions(filtered);
                             } else {
                               setSuggestions(activeDirectContacts); // Show all active contacts if input is empty on focus
                             }
                          }}
                          onBlur={() => {
                            // Delay hiding suggestions to allow click on popover content
                            setTimeout(() => {
                                if (!form.getFieldState("userName").isDirty) { // Check if popover is not the target
                                   // setIsInputFocused(false); // this causes popover to close before click
                                }
                            }, 150);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setShowSuggestions(false);
                                setIsInputFocused(false);
                                (e.target as HTMLElement).blur();
                            }
                          }}
                        />
                      </FormControl>
                    </PopoverAnchor>
                    {isInputFocused && showSuggestions && (
                      <PopoverContent
                        className="w-[calc(theme(space.96)-theme(space.12))] p-0"
                        side="bottom"
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent content from stealing focus
                        onInteractOutside={() => {
                           setIsInputFocused(false);
                           setShowSuggestions(false);
                        }}
                      >
                         <ScrollArea className="max-h-40">
                          {(suggestions.length > 0 || field.value.trim() === "") && activeDirectContacts.length > 0 ? (
                            <div className="py-1">
                              {(field.value.trim() === "" ? activeDirectContacts : suggestions).map(user => (
                                <div
                                  key={user.id}
                                  className="px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                                  onClick={() => handleSelectSuggestion(user)}
                                  onMouseDown={(e) => e.preventDefault()} // Prevent onBlur from firing on Input
                                >
                                  {user.name}
                                </div>
                              ))}
                            </div>
                          ) : (
                             field.value.trim() !== "" && <p className="p-3 text-sm text-muted-foreground">Pengguna tidak ditemukan atau tidak memiliki chat aktif.</p>
                          )}
                          {activeDirectContacts.length === 0 && <p className="p-3 text-sm text-muted-foreground">Tidak ada kontak aktif untuk disarankan.</p>}
                        </ScrollArea>
                      </PopoverContent>
                    )}
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { form.reset(); setShowSuggestions(false); setIsInputFocused(false); onOpenChange(false); }}>Batal</Button>
              <Button type="submit">Tambah Pengguna</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
