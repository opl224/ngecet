
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useMemo } from "react"; // Added useState, useEffect, useMemo
import type { User, Chat } from "@/types"; // Added Chat type
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Added Popover
import { ScrollArea } from "@/components/ui/scroll-area"; // Added ScrollArea
import { useToast } from "@/hooks/use-toast"; // Added useToast

const addUserFormSchema = z.object({
  userName: z.string().min(2, "Nama pengguna minimal 2 karakter.").max(50, "Nama terlalu panjang.").regex(/^[a-zA-Z0-9\s_']+$/, "Nama hanya boleh berisi huruf, angka, spasi, garis bawah, dan apostrof."),
});

type AddUserFormValues = z.infer<typeof addUserFormSchema>;

interface AddUserToGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddUser: (userName: string) => void;
  chats: Chat[]; // Added chats prop
  currentUserObj: User | null; // Added currentUserObj prop
}

export function AddUserToGroupDialog({
  isOpen,
  onOpenChange,
  onAddUser,
  chats,
  currentUserObj,
}: AddUserToGroupDialogProps) {
  const { toast } = useToast(); // Initialize toast
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: { userName: "" },
  });

  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    // Ensure unique contacts
    return contacts.filter((contact, index, self) =>
      index === self.findIndex((c) => c.id === contact.id)
    );
  }, [chats, currentUserObj]);

  useEffect(() => {
    const currentInput = form.getValues("userName");
    if (currentInput.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filteredSuggestions = activeDirectContacts.filter(contact =>
      contact.name.toLowerCase().includes(currentInput.toLowerCase())
    );
    setSuggestions(filteredSuggestions);
    setShowSuggestions(filteredSuggestions.length > 0 && currentInput.length > 0);
  }, [form.watch("userName"), activeDirectContacts]);


  function onSubmit(data: AddUserFormValues) {
    if (currentUserObj && data.userName.toLowerCase() === currentUserObj.name.toLowerCase()) {
      toast({ title: "Info", description: "Anda tidak dapat menambahkan diri sendiri.", variant: "default" });
      return;
    }
    onAddUser(data.userName);
    form.reset();
    onOpenChange(false);
    setShowSuggestions(false);
  }

  const handleSelectSuggestion = (suggestedUser: User) => {
    form.setValue("userName", suggestedUser.name, { shouldValidate: true });
    setShowSuggestions(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
        setShowSuggestions(false);
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
                  <Popover open={showSuggestions && suggestions.length > 0} onOpenChange={setShowSuggestions}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Input
                          placeholder="e.g., Alex Ray"
                          {...field}
                          autoFocus
                          onFocus={() => {
                            if (field.value.trim() !== "" && suggestions.length > 0) setShowSuggestions(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setShowSuggestions(false);
                            }
                          }}
                        />
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[calc(theme(space.96)-theme(space.12))] p-0" side="bottom" align="start">
                       <ScrollArea className="max-h-40">
                        {suggestions.length > 0 ? (
                          <div className="py-1">
                            {suggestions.map(user => (
                              <div
                                key={user.id}
                                className="px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                                onClick={() => handleSelectSuggestion(user)}
                              >
                                {user.name}
                              </div>
                            ))}
                          </div>
                        ) : (
                           field.value.trim() !== "" && <p className="p-3 text-sm text-muted-foreground">Pengguna tidak ditemukan atau tidak memiliki chat aktif.</p>
                        )}
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { form.reset(); setShowSuggestions(false); onOpenChange(false); }}>Batal</Button>
              <Button type="submit">Tambah Pengguna</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
