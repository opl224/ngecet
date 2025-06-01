
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
// Import ThemeProvider directly, and alias useTheme internally
import { ThemeProvider, useTheme as useNextThemesInternalHook } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // You can render a loader here if you prefer
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}

// Re-export the internally aliased hook as useTheme
export const useTheme = useNextThemesInternalHook;
