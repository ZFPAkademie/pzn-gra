'use client';

/**
 * Header Component
 * Sprint 1: Main header with navigation per SPRINT_1_PLAN.md §5.1
 */

import Link from 'next/link';
import { useState } from 'react';
import { Container } from '@/components/ui';
import { useLanguage } from '@/components/providers/language-provider';
import { LanguageSwitcher } from './language-switcher';

export function Header() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/o-projektu', label: t('nav.about') },
    { href: '/lokalita', label: t('nav.location') },
    { href: '/standardy', label: t('nav.standards') },
    { href: '/investicni-prilezitost', label: t('nav.investment') },
    { href: '/nemovitostni-produkt', label: t('nav.realEstateProduct') },
    { href: '/suites', label: t('nav.suites') },
    { href: '/apartmany-spindleruv-mlyn-pronajem', label: t('nav.rental') },
    { href: '/kontakt', label: t('nav.contact') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-300">
      <Container>
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-navy">Pod Zlatým návrším</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-stone-700 hover:text-navy hover:bg-stone rounded-md transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Language + Mobile menu */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 text-stone-700 hover:text-navy hover:bg-stone rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-stone-300">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-base font-medium text-stone-700 hover:text-navy hover:bg-stone rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </Container>
    </header>
  );
}
