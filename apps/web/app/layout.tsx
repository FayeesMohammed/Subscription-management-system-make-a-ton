import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Brightloop — Subscription Management & Recurring Billing',
  description: 'Multi-tenant subscription management and billing system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
