
import type {Metadata} from 'next';
import { Poppins } from 'next/font/google'; // Import Poppins
import './globals.css';
import { Providers } from '@/components/core/Providers';

// Instantiate Poppins with desired weights and subsets
const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap', // Improves font loading performance
  variable: '--font-poppins', // CSS variable for Poppins
});

export const metadata: Metadata = {
  title: 'Ngecet',
  description: 'Simple and elegant web chatting application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply Poppins font variable to the body */}
      <body className={`${poppins.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
