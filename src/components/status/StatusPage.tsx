
"use client";

import type { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MoreVertical, Plus, Pencil, Camera } from "lucide-react";

interface StatusPageProps {
  currentUser: User | null;
}

// Mock data for recent updates
const mockRecentUpdates = [
  { id: '1', userName: 'Nis', avatarUrl: 'https://placehold.co/128x128.png', timestamp: '13.49', isUnread: true, dataAiHint: "woman smiling" },
  { id: '2', userName: 'Dewi', avatarUrl: 'https://placehold.co/128x128.png', timestamp: '20 menit yang lalu', isUnread: true, dataAiHint: "abstract dark" },
  { id: '3', userName: 'Denz', avatarUrl: 'https://placehold.co/128x128.png', timestamp: '17.37', isUnread: true, dataAiHint: "car wheel" },
  { id: '4', userName: 'Suci', avatarUrl: 'https://placehold.co/128x128.png', timestamp: 'Kemarin', isUnread: true, dataAiHint: "makeup products" },
  { id: '5', userName: 'Barnas', avatarUrl: 'https://placehold.co/128x128.png', timestamp: 'Kemarin', isUnread: true, dataAiHint: "man profile" },
  { id: '6', userName: 'Miss Yuli', avatarUrl: 'https://placehold.co/128x128.png', timestamp: '06.38', isUnread: true, dataAiHint: "text document" },
  { id: '7', userName: 'Mawo', avatarUrl: 'https://placehold.co/128x128.png', timestamp: 'Kemarin', isUnread: false, dataAiHint: "group photo" },
];


export function StatusPage({ currentUser }: StatusPageProps) {
  if (!currentUser) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-muted-foreground">
        Memuat status pengguna...
      </div>
    );
  }

  const getInitials = (name: string | undefined, length: number = 1) => {
    if (!name) return "P"; 
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, length).toUpperCase();
    if (length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + (names.length > 1 ? names[names.length - 1][0].toUpperCase() : "");
  };

  return (
    <div className="flex flex-1 flex-col bg-background h-full relative">
      {/* Header */}
      <header className="flex items-center justify-between p-4 py-3 sticky top-0 bg-background z-10 border-b">
        <h1 className="text-2xl font-semibold text-foreground">Pembaruan</h1>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="text-foreground/70 md:hover:text-foreground">
            <Search className="h-5 w-5" />
            <span className="sr-only">Cari</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-foreground/70 md:hover:text-foreground">
            <MoreVertical className="h-5 w-5" />
            <span className="sr-only">Opsi lainnya</span>
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* My Status Section */}
          <div>
            <h2 className="text-md font-semibold mb-1.5 text-foreground">Status</h2>
            <div className="flex items-center space-x-3 cursor-pointer md:hover:bg-muted/30 p-1.5 -ml-1.5 rounded-lg">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={currentUser.avatarUrl} alt="My Status Avatar" data-ai-hint="person abstract"/>
                  <AvatarFallback>{getInitials(currentUser.name, 2)}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-background flex items-center justify-center">
                  <Plus className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Tambah Status</p>
                <p className="text-xs text-muted-foreground">Akan hilang setelah 24 jam</p>
              </div>
            </div>
          </div>

          {/* Recent Updates Section */}
          {mockRecentUpdates.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground mb-2 tracking-wide">PEMBARUAN TERKINI</h2>
              <div className="space-y-0.5">
                {mockRecentUpdates.map(update => (
                  <div key={update.id} className="flex items-center space-x-3 cursor-pointer md:hover:bg-muted/30 p-1.5 -ml-1.5 rounded-lg">
                    <div className={`relative p-0.5 rounded-full ${update.isUnread ? 'bg-gradient-to-tr from-green-400 to-emerald-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <Avatar className={`h-12 w-12 border-2 border-background`}>
                        <AvatarImage src={update.avatarUrl} alt={update.userName} data-ai-hint={update.dataAiHint} />
                        <AvatarFallback>{getInitials(update.userName, 2)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{update.userName}</p>
                      <p className="text-xs text-muted-foreground">{update.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 right-4 space-y-3 z-20">
         <Button variant="secondary" size="icon" className="rounded-2xl h-12 w-12 shadow-lg bg-card md:hover:bg-muted focus-visible:ring-gray-400">
            <Pencil className="h-5 w-5 text-foreground/90" />
            <span className="sr-only">Buat status teks</span>
         </Button>
         <Button variant="default" size="icon" className="rounded-2xl h-14 w-14 shadow-lg bg-green-500 md:hover:bg-green-600 text-white focus-visible:ring-green-300">
            <Camera className="h-6 w-6" />
            <span className="sr-only">Buat status foto</span>
         </Button>
      </div>
    </div>
  );
}
