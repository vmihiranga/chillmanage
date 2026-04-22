import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport: Viewport = {
  themeColor: '#f97316',
};

export const metadata: Metadata = {
  title: 'Chill Calendar',
  description: 'Your premium event scheduling app',
  manifest: '/manifest.json',
  keywords: ['calendar', 'events', 'scheduling', 'chill'],
  openGraph: {
    title: 'Chill Calendar',
    description: 'Schedule and manage your events effortlessly.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased text-gray-900 bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
