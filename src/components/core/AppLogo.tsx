
import Image from 'next/image';
import type { HTMLAttributes } from 'react';
import { cn } from "@/lib/utils";

interface AppLogoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  className?: string;
}

export function AppLogo({ className, ...props }: AppLogoProps) {
  // Pastikan file logo.png ada di direktori /public
  const logoSrc = "/logo.png";

  return (
    <div
      className={cn(
        "relative", // Diperlukan jika menggunakan layout="fill" pada Image
        className // Kelas dari parent untuk ukuran, e.g., "h-7 w-7"
      )}
      {...props}
      data-ai-hint="logo company"
    >
      <Image
        src={logoSrc}
        alt="Ngecet Logo"
        layout="fill" // Mengisi div parent
        objectFit="contain" // Menjaga aspek rasio, bisa 'cover' atau 'contain'
        // priority prop removed
      />
    </div>
  );
}
