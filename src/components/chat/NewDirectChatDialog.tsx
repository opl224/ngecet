
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { RegisteredUser } from "@/types"; // Import RegisteredUser
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

const directChatFormSchema = z.object({
  recipientName: z.string().min(2, "Username minimal 2 karakter.").max(50, "Username terlalu panjang.").regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh berisi huruf, angka, dan underscore."),
});

type DirectChatFormValues = z.infer<typeof directChatFormSchema>;

interface NewDirectChatDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateChat: (recipientUsername: string) => void;
  currentUserId: string | undefined;
  registeredUsers: RegisteredUser[]; // Tambahkan registeredUsers sebagai prop
}

export function NewDirectChatDialog({ isOpen, onOpenChange, onCreateChat, currentUserId, registeredUsers }: NewDirectChatDialogProps) {
  const form = useForm<DirectChatFormValues>({
    resolver: zodResolver(directChatFormSchema),
    defaultValues: { recipientName: "" },
  });

  function onSubmit(data: DirectChatFormValues) {
    const recipientUsername = data.recipientName.toLowerCase();
    if (recipientUsername === currentUserId?.toLowerCase()) { // Bandingkan dengan username (ID) pengguna saat ini
        form.setError("recipientName", { type: "manual", message: "Anda tidak bisa chat dengan diri sendiri." });
        return;
    }
    // Validasi apakah username ada di registeredUsers
    const recipientExists = registeredUsers.some(user => user.username.toLowerCase() === recipientUsername);
    if (!recipientExists) {
        form.setError("recipientName", { type: "manual", message: `Username "${data.recipientName}" tidak ditemukan.` });
        return;
    }

    onCreateChat(data.recipientName); // Kirim username
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Pesan Baru</DialogTitle>
          <DialogDescription>
            Cari pengguna berdasarkan username untuk memulai percakapan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan username" {...field} autoFocus/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { form.reset(); onOpenChange(false); }}>Batal</Button>
              <Button type="submit">Mulai pesan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
