import './globals.css';
import React from 'react';
import { AppProvider } from '@/lib/context';

export const metadata = {
  title: 'Brightloop — Subscription Management & Recurring Billing',
  description: 'Multi-tenant subscription management and recurring billing platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#08090d] text-slate-100 antialiased selection:bg-[#fcee21] selection:text-black">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
