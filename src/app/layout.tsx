import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-cormorant' });

export const metadata: Metadata = {
  title: 'SanctuaryOS',
  description: 'An immersive worship platform concept combining projection control, room intelligence, atmosphere design, and live ministry workflows.',
  applicationName: 'SanctuaryOS',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <body className="font-sans text-slate-100 bg-slate-950" suppressHydrationWarning>{children}</body>
    </html>
  );
}
