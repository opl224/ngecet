
import Image from 'next/image';
import type { HTMLAttributes } from 'react';

interface AppLogoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  className?: string; // className untuk styling, terutama ukuran
  // Anda bisa menambahkan props lain jika diperlukan, seperti width dan height spesifik
  // namun dengan 'fill', ukuran akan dikontrol oleh parent dan className
}

export function AppLogo({ className, ...props }: AppLogoProps) {
  // Placeholder image, ganti dengan path ke logo PNG Anda di direktori /public
  // Contoh: src="/logo.png"
  const logoSrc = "https://placehold.co/100x100.png";

  return (
    <div
      className={cn(
        "relative", // Diperlukan jika menggunakan layout="fill" pada Image
        className // Kelas dari parent untuk ukuran, e.g., "h-7 w-7"
      )}
      {...props}
      data-ai-hint="logo company" // Petunjuk untuk AI jika ingin mengganti gambar
    >
      <Image
        src={logoSrc}
        alt="SimplicChat Logo"
        layout="fill" // Mengisi div parent
        objectFit="contain" // Menjaga aspek rasio, bisa 'cover' atau 'contain'
        priority // Penting untuk LCP jika logo adalah bagian utama
      />
    </div>
  );
}

// Helper function cn jika belum ada di file ini, atau impor dari lib/utils
// Asumsi cn sudah ada di lib/utils dan diimpor di tempat lain jika diperlukan.
// Untuk berdiri sendiri, bisa ditambahkan di sini:
function cn(...inputs: Array<string | undefined | null | Record<string, boolean>>): string {
  return inputs
    .flat()
    .filter(x => typeof x === 'string' || (typeof x === 'object' && x !== null))
    .map(x => typeof x === 'string' ? x : Object.entries(x).filter(([, v]) => v).map(([k]) => k))
    .flat()
    .join(' ');
}
