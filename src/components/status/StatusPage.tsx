
"use client";

import type { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppLogo } from "@/components/core/AppLogo";

interface StatusPageProps {
    currentUser: User | null;
}

export function StatusPage({ currentUser }: StatusPageProps) {
    if (!currentUser) {
        return (
          <div className="flex flex-1 flex-col items-center justify-center p-4 text-muted-foreground">
            <AppLogo className="h-12 w-12 mb-4 animate-pulse text-primary" />
            Memuat status pengguna...
          </div>
        );
    }

    const getInitials = (name: string | undefined) => {
        if (!name) return "??";
        const names = name.split(' ');
        if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
        return names[0][0].toUpperCase() + (names.length > 1 ? names[names.length - 1][0].toUpperCase() : "");
    };

    return (
        <div className="flex flex-1 flex-col items-center justify-center p-4 bg-muted/10 dark:bg-neutral-800/30">
            <Card className="w-full max-w-md shadow-xl rounded-xl">
                <CardHeader className="items-center text-center p-6">
                    <Avatar className="h-28 w-28 mb-4 border-4 border-primary shadow-md">
                        <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="person abstract large"/>
                        <AvatarFallback className="text-4xl font-semibold">{getInitials(currentUser.name)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-3xl font-bold">{currentUser.name}</CardTitle>
                    <CardDescription className="text-md text-muted-foreground mt-1">
                        @{currentUser.id}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center p-6 pt-2">
                    <div className="mb-6">
                        <p className="text-lg font-semibold text-green-500 dark:text-green-400">{currentUser.status || "Online"}</p>
                        <p className="text-xs text-muted-foreground">Status saat ini</p>
                    </div>
                    <div className="bg-accent/20 dark:bg-accent/10 p-4 rounded-lg">
                        <p className="text-sm text-accent-foreground dark:text-accent-foreground/90">
                            Halaman status ini masih dalam tahap pengembangan. 
                            Fitur menarik akan segera hadir!
                        </p>
                    </div>
                </CardContent>
            </Card>
             <p className="text-xs text-muted-foreground mt-8">Ngecet App &copy; {new Date().getFullYear()}</p>
        </div>
    );
}

