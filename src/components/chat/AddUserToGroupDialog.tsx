
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

const addUserFormSchema = z.object({
  userName: z.string().min(2, "User name must be at least 2 characters.").max(50, "Name is too long.").regex(/^[a-zA-Z0-9\s_']+$/, "Name can only contain letters, numbers, spaces, underscores, and apostrophes."),
});

type AddUserFormValues = z.infer<typeof addUserFormSchema>;

interface AddUserToGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddUser: (userName: string) => void;
}

export function AddUserToGroupDialog({ isOpen, onOpenChange, onAddUser }: AddUserToGroupDialogProps) {
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: { userName: "" },
  });

  function onSubmit(data: AddUserFormValues) {
    onAddUser(data.userName);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) form.reset(); // Reset form if dialog is closed
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add User to Group</DialogTitle>
          <DialogDescription>
            Enter the name of the user you want to add to this group.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Alex Ray" {...field} autoFocus/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { form.reset(); onOpenChange(false); }}>Cancel</Button>
              <Button type="submit">Add User</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
