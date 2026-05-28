/**
 * Admin Layout
 * Simple, clean layout for admin pages
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | Golden Ridge',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone">
      {children}
    </div>
  );
}
