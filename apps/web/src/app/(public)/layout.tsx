/**
 * Public Routes Layout
 * Sprint 1: Public pages layout with Header + Footer
 */

import { PublicLayout } from '@/components/layouts';

export default function PublicRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayout>{children}</PublicLayout>;
}
