/**
 * Public Layout Component
 * Sprint 1: Wrapper with nav + footer per SPRINT_1_PLAN.md §5.1
 */

import { Header } from './header';
import { Footer } from './footer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
