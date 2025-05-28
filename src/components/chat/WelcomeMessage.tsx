
"use client";

import { AppLogo } from "@/components/core/AppLogo";
import { MessageSquareDashed } from "lucide-react";

export function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center p-8 bg-background">
      <MessageSquareDashed className="w-24 h-24 text-primary mb-6" strokeWidth={1.5}/>
      <AppLogo className="w-10 h-10 text-primary mb-2" />
      <h1 className="text-3xl font-semibold mb-2 text-foreground">Welcome to SimplicChat</h1>
      <p className="text-muted-foreground max-w-md">
        Select a chat from the sidebar to start messaging, or create a new direct message or group chat.
        All your conversations are stored locally in your browser.
      </p>
    </div>
  );
}

    