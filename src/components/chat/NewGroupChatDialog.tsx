
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
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const groupChatFormSchema = z.object({
  groupName: z.string().min(2, "Group name must be at least 2 characters.").max(30, "Group name is too long."),
  memberNames: z.string().min(1, "Add at least one member (besides yourself).")
    .transform(value => value.split(',').map(name => name.trim()).filter(name => name.length > 0))
    .refine(value => value.length > 0, { message: "Add at least one valid member name."}),
});

type GroupChatFormValues = z.infer<typeof groupChatFormSchema>;

interface NewGroupChatDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateChat: (groupName: string, memberNames: string[]) => void;
  currentUserId: string | undefined;
}

export function NewGroupChatDialog({ isOpen, onOpenChange, onCreateChat, currentUserId }: NewGroupChatDialogProps) {
  const form = useForm<GroupChatFormValues>({
    resolver: zodResolver(groupChatFormSchema),
    defaultValues: { groupName: "", memberNames: "" as unknown as string[] }, // RHF needs string for initial textarea
  });

  function onSubmit(data: GroupChatFormValues) {
    // data.memberNames is already transformed to string[] by Zod
    if (data.memberNames.includes(currentUserId || '')) {
      form.setError("memberNames", { type: "manual", message: "You are automatically included. Don't add yourself." });
      return;
    }
    onCreateChat(data.groupName, data.memberNames);
    form.reset({ groupName: "", memberNames: "" as unknown as string[] });
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                    <Input placeholder="e.g., Project Team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memberNames"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member Names (comma-separated)</FormLabel>
                  <FormControl>
                    {/* Zod transform handles the string to string[] conversion */}
                    <Textarea placeholder="e.g., JohnDoe, AliceSmith" {...field as any} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { form.reset({ groupName: "", memberNames: "" as unknown as string[] }); onOpenChange(false); }}>Cancel</Button>
              <Button type="submit">Create Group</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
