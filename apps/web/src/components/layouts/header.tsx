'use client';

/**
 * Header Component
 * Design Checklist 2030: Pouze wordmark, glassmorphism pro sticky nav
 */

import Link from 'next/link';
import { useState } from 'react';
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-navy/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Wordmark only */}
          <Link href="/" className="text-navy tracking-wide">
            <span className="text-lg font-medium">Pod Zlatým</span>
            <span className="text-lg font-light ml-1">návrším</span>
          </Link>

          {/* Desktop Navigation - minimal */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-navy/60 hover:text-navy transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-6">
            <LanguageSwitcher />

            {/* Mobile menu button - minimal */}
            <button
              type="button"
              className="lg:hidden text-navy/60 hover:text-navy"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-8 border-t border-navy/5">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-navy/60 hover:text-navy transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
