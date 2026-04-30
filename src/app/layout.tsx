import type { Metadata } from 'next';
import { Inter, Zen_Antique_Soft } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const zen = Zen_Antique_Soft({ subsets: ['latin'], weight: '400', variable: '--font-zen' });

export const metadata: Metadata = {
  title: 'TreeSound Booking',
  description: 'Book studio rooms at TreeSound — fast, simple, reliable.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${zen.variable}`}>
      <body className="min-h-screen">
        <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <img src="/treesound-logo.png" alt="TreeSound" className="h-7 w-auto" />
            </div>
            <nav className="text-sm text-neutral-700">
              <a className="mr-4 transition hover:text-black" href="/rooms">Rooms</a>
              <a className="transition hover:text-black" href="/login">Sign in</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="mt-10 border-t border-neutral-200 py-6 text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} TreeSound Studios
        </footer>
      </body>
    </html>
  );
}
