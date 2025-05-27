
"use client";

import type { User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(30, "Name must not exceed 30 characters."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfileFormProps {
  currentUser: User | null;
  onSaveProfile: (name: string) => void;
}

export function UserProfileForm({ currentUser, onSaveProfile }: UserProfileFormProps) {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: currentUser?.name || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (isProfileDialogOpen && currentUser) {
      form.reset({ name: currentUser.name || "" });
    }
  }, [isProfileDialogOpen, currentUser, form]);

  function onSubmit(data: ProfileFormValues) {
    onSaveProfile(data.name);
    setIsProfileDialogOpen(false); // Close dialog on save
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return "??";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }

  // Jika currentUser null, ini adalah form setup awal, bukan yang di sidebar
  if (!currentUser) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Save Profile</Button>
        </form>
      </Form>
    );
  }

  return (
    <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
      <div className="p-4 space-y-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.name} data-ai-hint="abstract person" />
            <AvatarFallback>{getInitials(currentUser?.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-sidebar-foreground">{currentUser?.name || "Set Your Name"}</h3>
                <p className="text-xs text-sidebar-foreground/70">{currentUser?.id ? `@${currentUser.id}` : 'Not set'}</p>
              </div>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
                  <Edit3 className="h-4 w-4" />
                  <span className="sr-only">Edit Profile</span>
                </Button>
              </DialogTrigger>
            </div>
          </div>
        </div>
      </div>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your display name. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProfileDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
