'use client';

/**
 * Path Selector Component
 * Sprint 1: Sale vs Rental CTA per SPRINT_1_PLAN.md §5.2
 */

import Link from 'next/link';
import { Container, Section, Card } from '@/components/ui';
import { useLanguage } from '@/components/providers/language-provider';

export function PathSelector() {
  const { t } = useLanguage();

  return (
    <Section background="light">
      <Container>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Sale Path */}
          <Link href="/investicni-prilezitost" className="block group">
            <Card hover className="h-full p-8 text-center">
              <div className="mb-6">
                {/* House/Key icon */}
                <div className="w-16 h-16 mx-auto bg-gold-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-navy mb-2">
                {t('home.ctaSale')}
              </h3>
              <p className="text-stone-700 mb-4">
                {t('home.ctaSaleSubtitle')}
              </p>
              <span className="inline-flex items-center text-gold font-medium group-hover:text-amber-700">
                {t('common.learnMore')}
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Card>
          </Link>

          {/* Rental Path */}
          <Link href="/golden-ridge-apartments" className="block group">
            <Card hover className="h-full p-8 text-center">
              <div className="mb-6">
                {/* Calendar/Bed icon */}
                <div className="w-16 h-16 mx-auto bg-sky-100 rounded-full flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                  <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-navy mb-2">
                {t('home.ctaRental')}
              </h3>
              <p className="text-stone-700 mb-4">
                {t('home.ctaRentalSubtitle')}
              </p>
              <span className="inline-flex items-center text-sky-600 font-medium group-hover:text-sky-700">
                {t('common.learnMore')}
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Card>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
