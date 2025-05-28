
import Image from 'next/image';
import type { HTMLAttributes } from 'react';
import { cn } from "@/lib/utils"; // Assuming cn is in lib/utils

interface AppLogoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  className?: string;
}

export function AppLogo({ className, ...props }: AppLogoProps) {
  // Path ke logo PNG Anda di direktori /public
  const logoSrc = "/logo.png"; // Ganti ini jika nama file Anda berbeda

  return (
    <div
      className={cn(
        "relative", // Diperlukan jika menggunakan layout="fill" pada Image
        className // Kelas dari parent untuk ukuran, e.g., "h-7 w-7"
      )}
      {...props}
      data-ai-hint="logo company" // Anda bisa mengubah hint ini jika mau
    >
      <Image
        src={logoSrc}
        alt="Ngecet Logo"
        layout="fill" // Mengisi div parent
        objectFit="contain" // Menjaga aspek rasio, bisa 'cover' atau 'contain'
        priority // Penting untuk LCP jika logo adalah bagian utama
      />
    </div>
  );
}

// Fungsi cn tidak perlu ada di sini jika sudah diimpor dari @/lib/utils
// function cn(...inputs: Array<string | undefined | null | Record<string, boolean>>): string {
//   return inputs
//     .flat()
//     .filter(x => typeof x === 'string' || (typeof x === 'object' && x !== null))
//     .map(x => typeof x === 'string' ? x : Object.entries(x).filter(([, v]) => v).map(([k]) => k))
//     .flat()
//     .join(' ');
// }
