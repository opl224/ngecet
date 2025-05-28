
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
import { useToast } from "@/hooks/use-toast";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(30, "Name must not exceed 30 characters."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfileFormProps {
  currentUser: User | null;
  onSaveProfile: (name: string) => void;
  displayMode?: "full" | "compact";
}

export function UserProfileForm({ currentUser, onSaveProfile, displayMode = "full" }: UserProfileFormProps) {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: currentUser?.name || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (currentUser) { // Only reset if currentUser exists, to avoid issues on initial load
      form.reset({ name: currentUser.name || "" });
    }
  }, [isProfileDialogOpen, currentUser, form]);


  function onSubmit(data: ProfileFormValues) {
    onSaveProfile(data.name);
    setIsProfileDialogOpen(false); 
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return "??";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }

  if (!currentUser) {
    // Initial setup form when no currentUser
    return (
      <div className="p-8 bg-card shadow-xl rounded-lg w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2">
          {/* Assuming AppLogo might be used here or similar branding */}
          <h1 className="text-2xl font-bold text-center text-foreground">Selamat Datang di Ngecet</h1>
          <p className="text-sm text-muted-foreground text-center">Silakan atur profil Anda untuk memulai.</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Simpan</Button>
          </form>
        </Form>
      </div>
    );
  }

  // For logged-in user
  return (
    <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
      {displayMode === "compact" ? (
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full p-0 h-9 w-9 hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="abstract person small" />
              <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Ubah Profil</span>
          </Button>
        </DialogTrigger>
      ) : ( // "full" displayMode (default)
        <div className="p-4 space-y-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="abstract person" />
              <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0"> {/* Added min-w-0 for better truncation */}
              <div className="flex items-center justify-between">
                <div className="truncate"> {/* Added truncate for name/id container */}
                  <h3 className="font-semibold text-lg text-sidebar-foreground truncate">{currentUser.name}</h3>
                  <p className="text-xs text-sidebar-foreground/70 truncate">@{currentUser.id}</p>
                </div>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:text-sidebar-foreground shrink-0"> {/* Added shrink-0 */}
                    <Edit3 className="h-4 w-4" />
                    <span className="sr-only">Ubah Profil</span>
                  </Button>
                </DialogTrigger>
              </div>
            </div>
          </div>
        </div>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ubah Profil</DialogTitle>
          {/* <DialogDescription>
            Make changes to your display name. Click save when you're done.
          </DialogDescription> */}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} autoFocus/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProfileDialogOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
