
"use client";

import type { User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3 } from "lucide-react";
import { useState } from "react";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(30, "Name must not exceed 30 characters."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfileFormProps {
  currentUser: User | null;
  onSaveProfile: (name: string) => void;
}

export function UserProfileForm({ currentUser, onSaveProfile }: UserProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: currentUser?.name || "",
    },
    mode: "onChange",
  });

  function onSubmit(data: ProfileFormValues) {
    onSaveProfile(data.name);
    setIsEditing(false);
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return "??";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }

  return (
    <div className="p-4 space-y-4 border-b border-sidebar-border">
      <div className="flex items-center space-x-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.name} data-ai-hint="abstract person" />
          <AvatarFallback>{getInitials(currentUser?.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          {isEditing ? (
             <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} className="text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-2">
                  <Button type="submit" size="sm">Save</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => {
                    setIsEditing(false);
                    form.reset({ name: currentUser?.name || "" });
                  }}>Cancel</Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-sidebar-foreground">{currentUser?.name || "Set Your Name"}</h3>
                <p className="text-xs text-sidebar-foreground/70">{currentUser?.id ? `@${currentUser.id}` : 'Not set'}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
                <Edit3 className="h-4 w-4" />
                <span className="sr-only">Edit Profile</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
