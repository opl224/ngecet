
"use client";

import type { User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const profileFormSchema = z.object({
  name: z.string().min(2, "Nama harus minimal 2 karakter.").max(30, "Nama tidak boleh melebihi 30 karakter."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfileFormProps {
  currentUser: User | null;
  onSaveProfile: (name: string) => void;
  displayMode?: "full" | "compact";
  userEmail?: string; // New prop for email
}

export function UserProfileForm({ currentUser, onSaveProfile, displayMode = "full", userEmail }: UserProfileFormProps) {
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
    if (currentUser) { 
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
    // This part is for the initial setup when no currentUser is present (AuthPage handles this now)
    // So, this block might not be reached if AuthPage is always shown first.
    // However, keeping it for robustness or if AuthPage logic changes.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="p-8 bg-card shadow-xl rounded-lg w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-2">
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
                    <FormLabel>Nama Tampilan</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama Anda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Simpan</Button>
            </form>
          </Form>
        </div>
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
      ) : ( 
        // This "full" display mode within sidebar is not currently used,
        // but keeping the structure if needed in future.
        // The trigger is now primarily the compact avatar.
        <div className="p-4 space-y-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="abstract person" />
              <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0"> 
              <div className="flex items-center justify-between">
                <div className="truncate"> 
                  <h3 className="font-semibold text-lg text-sidebar-foreground truncate">{currentUser.name}</h3>
                  <p className="text-xs text-sidebar-foreground/70 truncate">@{currentUser.id}</p>
                </div>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-sidebar-foreground/70 hover:text-sidebar-foreground shrink-0"> 
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
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={userEmail || "Email tidak tersedia"}
                readOnly
                className="bg-muted/50 cursor-not-allowed border-input"
              />
            </FormItem>
            <FormItem>
              <FormLabel>Username</FormLabel>
              <Input
                type="text"
                value={currentUser.id} 
                readOnly
                className="bg-muted/50 cursor-not-allowed border-input" 
              />
            </FormItem>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Tampilan</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama" {...field} autoFocus/>
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

