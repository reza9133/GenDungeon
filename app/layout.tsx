import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/lib/useWallet';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GenDungeon | AI RPG',
  description: 'AI-Powered Role-Playing Game on GenLayer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap the entire application with WalletProvider */}
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
