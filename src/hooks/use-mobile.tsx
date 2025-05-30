
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false); // Default to false

  React.useEffect(() => {
    // Function to update mobile state
    const updateMobileState = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Set initial state on client mount
    updateMobileState();

    // Listener for resize
    window.addEventListener('resize', updateMobileState);

    // Cleanup
    return () => window.removeEventListener('resize', updateMobileState);
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  return isMobile;
}
