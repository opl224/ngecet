
"use client"; // Added "use client" as it's a client-side hook using window
// This file was previously src/hooks/use-local-storage.ts and only contained useIsMobile.
// It has been renamed to src/hooks/use-mobile.ts for clarity.

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
        return;
    }
    const updateMobileState = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    updateMobileState();
    window.addEventListener('resize', updateMobileState);
    return () => window.removeEventListener('resize', updateMobileState);
  }, []);

  return isMobile;
}
