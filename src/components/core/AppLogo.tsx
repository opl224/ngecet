
import type { HTMLAttributes } from 'react';
import Image from 'next/image';
import { cn } from "@/lib/utils";

interface AppLogoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  className?: string;
}

export function AppLogo({ className, ...props }: AppLogoProps) {
  const logoSrc = "/logo.png"; // Path to your logo in the public directory

  return (
    <div
      className={cn(
        "relative flex items-center justify-center", // Removed border and text styles, added relative for next/image
        className // Parent-defined size, e.g., "h-7 w-7"
      )}
      {...props}
      data-ai-hint="app logo" // Updated hint
    >
      <Image
        src={logoSrc}
        alt="Ngecet Logo"
        layout="fill"
        objectFit="contain" // Or "cover", depending on how you want the image to fit
      />
    </div>
  );
}
