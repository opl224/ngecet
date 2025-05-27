
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
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
    <>
      {children}
      <Toaster />
    </>
  );
}
