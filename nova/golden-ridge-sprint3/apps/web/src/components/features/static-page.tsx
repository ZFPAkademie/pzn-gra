'use client';

/**
 * Static Page Component
 * Sprint 1: Reusable component for static content pages
 * 
 * Used for: lokalita, standardy, o-projektu, kdo-stavi-chaty
 */

import { Container, Section, SectionHeader } from '@/components/ui';

interface StaticPageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function StaticPage({ title, subtitle, children }: StaticPageProps) {
  return (
    <>
      {/* Page Header */}
      <Section background="light" className="py-12 md:py-16">
        <Container size="narrow">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl text-slate-600">
              {subtitle}
            </p>
          )}
        </Container>
      </Section>

      {/* Page Content */}
      <Section>
        <Container size="narrow">
          <div className="prose prose-slate prose-lg max-w-none">
            {children}
          </div>
        </Container>
      </Section>
    </>
  );
}

/**
 * Placeholder Content Component
 * Shows placeholder text when real content is not yet available
 */
export function PlaceholderContent({ pageName }: { pageName: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800">
      <p className="font-medium mb-2">Placeholder content</p>
      <p className="text-sm">
        Real content for &quot;{pageName}&quot; will be provided by the client. 
        This placeholder demonstrates the page structure and layout.
      </p>
    </div>
  );
}
