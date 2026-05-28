'use client';

/**
 * Footer Component
 * Sprint 1: Main footer per SPRINT_1_PLAN.md §5.1
 */

import Link from 'next/link';
import { Container } from '@/components/ui';
import { useLanguage } from '@/components/providers/language-provider';
import { LanguageSwitcherCompact } from './language-switcher';

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: '/o-projektu', label: t('nav.about') },
    { href: '/lokalita', label: t('nav.location') },
    { href: '/investicni-prilezitost', label: t('nav.investment') },
    { href: '/apartmany-spindleruv-mlyn-pronajem', label: t('nav.rental') },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <Container>
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold text-white mb-2">{t('footer.company')}</h3>
              <p className="text-slate-400 mb-4">{t('footer.tagline')}</p>
              <div className="mt-4">
                <LanguageSwitcherCompact />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {t('footer.quickLinks')}
              </h4>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {t('footer.contact')}
              </h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <span className="block text-sm text-slate-500">{t('common.phone')}:</span>
                  <a href="tel:+420736242624" className="hover:text-white transition-colors">
                    +420 736 242 624
                  </a>
                </li>
                <li>
                  <span className="block text-sm text-slate-500">{t('common.email')}:</span>
                  <a href="mailto:michal.novotny@zfpa.cz" className="hover:text-white transition-colors">
                    michal.novotny@zfpa.cz
                  </a>
                </li>
                <li>
                  <span className="block text-sm text-slate-500">{t('common.address')}:</span>
                  <span>Špindlerův Mlýn, Česká republika</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-slate-500">
              {t('footer.copyright', { year: currentYear.toString() })}
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-slate-500 hover:text-slate-300 transition-colors">
                {t('footer.privacy')}
              </Link>
              <Link href="/terms" className="text-slate-500 hover:text-slate-300 transition-colors">
                {t('footer.terms')}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
