
"use client";

import { AppLogo } from "@/components/core/AppLogo";
import { MessageSquareDashed } from "lucide-react";

export function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center p-8 bg-background">
      <MessageSquareDashed className="w-24 h-24 text-primary mb-6" strokeWidth={1.5}/>
      <AppLogo className="w-10 h-10 text-primary mb-2" />
    </div>
  );
}

    