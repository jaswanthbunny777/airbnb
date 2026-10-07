/* eslint-disable */
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import Header from '@/components/Header';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Airbnb – Vacation rentals, cabins, beach houses & more',
  description: 'Find the perfect place to stay at an amazing price in 191+ countries. Belong anywhere with Airbnb.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main>{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
