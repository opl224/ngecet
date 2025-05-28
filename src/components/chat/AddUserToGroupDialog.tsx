
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { User } from "@/types"; // Chat type is not needed here
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
import { useToast } from "@/hooks/use-toast";

const addUserFormSchema = z.object({
  userName: z.string().min(2, "Nama pengguna minimal 2 karakter.").max(50, "Nama terlalu panjang.").regex(/^[a-zA-Z0-9\s_']+$/, "Nama hanya boleh berisi huruf, angka, spasi, garis bawah, dan apostrof."),
});

type AddUserFormValues = z.infer<typeof addUserFormSchema>;

interface AddUserToGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddUser: (userName: string) => void;
  currentUserObj: User | null;
}

export function AddUserToGroupDialog({
  isOpen,
  onOpenChange,
  onAddUser,
  currentUserObj,
}: AddUserToGroupDialogProps) {
  const { toast } = useToast();
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: { userName: "" },
  });

  function onSubmit(data: AddUserFormValues) {
    if (currentUserObj && data.userName.toLowerCase() === currentUserObj.name.toLowerCase()) {
      toast({ title: "Info", description: "Anda tidak dapat menambahkan diri sendiri.", variant: "default" });
      return;
    }
    onAddUser(data.userName);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna ke Grup</DialogTitle>
          <DialogDescription>
            Masukkan nama pengguna yang ingin Anda tambahkan. Pastikan Anda sudah memiliki chat aktif dengan pengguna tersebut.
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
                    <Input
                      placeholder="e.g., Alex Ray"
                      {...field}
                      autoFocus
                    />
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { form.reset(); onOpenChange(false); }}>Batal</Button>
              <Button type="submit">Tambah Pengguna</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
