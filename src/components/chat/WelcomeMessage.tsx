
"use client";

import { AppLogo } from "@/components/core/AppLogo";

export function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center p-8 bg-background">
      <AppLogo className="w-10 h-10 text-primary mb-4" />
      <p className="text-lg text-muted-foreground">
        lu gabut? yaa ngecet lah
      </p>
    </div>
  );
}
