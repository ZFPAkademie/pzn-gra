'use client';

/**
 * Header - Design 2030 with logo
 */

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useLanguage } from '@/components/providers/language-provider';
import { LanguageSwitcher } from './language-switcher';

export function Header() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pronájem na prvním místě; prodej, o projektu a investice jsou pod „Prodej" (13. 10. 2026)
  const navItems = [
    { href: '/apartmany-spindleruv-mlyn-pronajem', label: t('nav.rental') },
    { href: '/lokalita', label: t('nav.location') },
  ];
  const saleItems = [
    { href: '/suites', label: t('nav.saleApartments') },
    { href: '/o-projektu', label: t('nav.about') },
    { href: '/kalkulacka', label: t('nav.investment') },
  ];
  const contactItem = { href: '/kontakt', label: t('nav.contact') };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-navy/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo-nove.png"
            alt="Pod Zlatým návrším"
            width={50}
            height={50}
            className="mr-3"
          />
          <span className="hidden sm:block">
            <span className="text-lg font-medium text-navy">Pod Zlatým</span>
            <span className="text-lg font-light text-navy/70 ml-1">návrším</span>
          </span>
        </Link>

        {/* Desktop Nav */}
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

          {/* Prodej — rozbalovací (hover i klávesnice přes focus-within) */}
          <div className="relative group">
            <Link
              href="/suites"
              className="inline-flex items-center gap-1 text-sm text-navy/60 hover:text-navy group-hover:text-navy group-focus-within:text-navy transition-colors"
              aria-haspopup="true"
            >
              {t('nav.saleMenu')}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </Link>
            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full pt-4">
              <div className="bg-white border border-navy/10 shadow-lg min-w-[220px] py-2">
                {saleItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-5 py-2.5 text-sm text-navy/70 hover:text-navy hover:bg-stone transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href={contactItem.href}
            className="text-sm text-navy/60 hover:text-navy transition-colors"
          >
            {contactItem.label}
          </Link>
          <LanguageSwitcher />
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-navy"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-navy/5">
          <nav className="max-w-7xl mx-auto px-6 py-6 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-navy/70 hover:text-navy transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div>
              <p className="text-xs text-navy/40 uppercase tracking-widest mb-3">{t('nav.saleMenu')}</p>
              <div className="space-y-3 pl-4 border-l border-navy/10">
                {saleItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-navy/70 hover:text-navy transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href={contactItem.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-navy/70 hover:text-navy transition-colors"
            >
              {contactItem.label}
            </Link>
            <div className="pt-4 border-t border-navy/10">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
