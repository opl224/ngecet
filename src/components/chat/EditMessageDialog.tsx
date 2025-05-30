
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
import type { Message } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const editMessageFormSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty."),
});

type EditMessageFormValues = z.infer<typeof editMessageFormSchema>;

interface EditMessageDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  messageToEdit: Message | null;
  onSaveEdit: (messageId: string, newContent: string) => void;
}

export function EditMessageDialog({ isOpen, onOpenChange, messageToEdit, onSaveEdit }: EditMessageDialogProps) {
  const { toast } = useToast();
  const form = useForm<EditMessageFormValues>({
    resolver: zodResolver(editMessageFormSchema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    if (messageToEdit && isOpen) {
      form.reset({ content: messageToEdit.content });
    }
  }, [messageToEdit, isOpen, form]);

  function onSubmit(data: EditMessageFormValues) {
    if (messageToEdit) {
      if (data.content === messageToEdit.content) {
        toast({ title: "Info Pesan", description: "Konten pesan tidak berubah." });
        onOpenChange(false);
        return;
      }
      onSaveEdit(messageToEdit.id, data.content);
    }
    onOpenChange(false);
  }

  if (!messageToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) { // If dialog is being closed
        form.reset({ content: messageToEdit?.content || "" }); // Reset form to original on cancel/close
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ubah Profil</DialogTitle>
          <DialogDescription>
            Make changes to your message. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Edit your message..." {...field} rows={4} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                 form.reset({ content: messageToEdit?.content || "" }); // Reset form explicitly on cancel
                 onOpenChange(false);
              }}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

