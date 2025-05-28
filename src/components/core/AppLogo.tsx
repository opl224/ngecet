
import type { HTMLAttributes } from 'react';
import { cn } from "@/lib/utils";

interface AppLogoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  className?: string;
}

export function AppLogo({ className, ...props }: AppLogoProps) {
  // Temporarily using a simple div instead of next/image for diagnostics
  return (
    <div
      className={cn(
        "flex items-center justify-center border border-dashed border-muted-foreground text-primary text-xs font-semibold",
        className // Parent-defined size, e.g., "h-7 w-7"
      )}
      {...props}
      data-ai-hint="logo company placeholder"
    >
      <span>LOGO</span>
    </div>
  );
}
