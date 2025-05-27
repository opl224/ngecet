
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  recipientName: z.string().min(1, "Recipient name cannot be empty.").max(30, "Name is too long."),
});

type DirectChatFormValues = z.infer<typeof directChatFormSchema>;

interface NewDirectChatDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateChat: (recipientName: string) => void;
  currentUserId: string | undefined;
}

export function NewDirectChatDialog({ isOpen, onOpenChange, onCreateChat, currentUserId }: NewDirectChatDialogProps) {
  const form = useForm<DirectChatFormValues>({
    resolver: zodResolver(directChatFormSchema),
    defaultValues: { recipientName: "" },
  });

  function onSubmit(data: DirectChatFormValues) {
    if (data.recipientName === currentUserId) {
        form.setError("recipientName", { type: "manual", message: "You cannot start a chat with yourself." });
        return;
    }
    onCreateChat(data.recipientName);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Direct Message</DialogTitle>
          <DialogDescription>
            Enter the name of the user you want to message.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., JaneDoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { form.reset(); onOpenChange(false); }}>Cancel</Button>
              <Button type="submit">Start Chat</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
