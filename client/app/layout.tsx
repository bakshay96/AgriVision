import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'AgriVision Pro',
    template: '%s | AgriVision Pro',
  },
  description:
    'AI-powered multi-tenant farming SaaS — Real-time crop monitoring, disease detection, and B2B marketplace.',
  keywords: ['agriculture', 'farming', 'AI', 'crop monitoring', 'marketplace', 'SaaS'],
  authors: [{ name: 'AgriVision Pro' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    title: 'AgriVision Pro',
    description: 'AI-powered farming SaaS platform',
    siteName: 'AgriVision Pro',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
