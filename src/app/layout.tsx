import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TreeSound Booking',
  description: 'Book studio rooms at TreeSound — fast, simple, reliable.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-50">
        <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="text-lg font-semibold tracking-tight">TreeSound</div>
            <nav className="text-sm text-neutral-300">
              <a className="hover:text-white transition" href="/login">Sign in</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="mt-10 border-t border-neutral-800 py-6 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} TreeSound Studios
        </footer>
      </body>
    </html>
  );
}
