'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const primaryItems = [
  { href: '/admin/leads', label: 'Leady' },
  { href: '/admin/rezervace', label: 'Rezervace' },
  { href: '/admin/apartmany', label: 'Apartmány' },
];

const secondaryItems = [
  { href: '/admin/majitele', label: 'Majitelé' },
  { href: '/admin/ceniky', label: 'Ceníky' },
  { href: '/admin/blokace', label: 'Blokace' },
  { href: '/admin/svj', label: 'SVJ' },
  { href: '/admin/channel-manager', label: 'Channels' },
];

const allItems = [...primaryItems, ...secondaryItems];

export function AdminNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);
  const anySecondaryActive = secondaryItems.some((i) => isActive(i.href));

  return (
    <>
      {/* Desktop nav */}
      <header className="bg-white shadow-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <span className="text-lg font-light text-navy tracking-wide whitespace-nowrap">Pod Zlatým návrším</span>
            <nav className="flex items-center gap-6">
              {allItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive(item.href)
                      ? 'text-sm font-medium text-navy border-b border-navy pb-0.5'
                      : 'text-sm text-slate-500 hover:text-navy transition-colors'
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
              Odhlásit
            </button>
          </form>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="bg-white shadow-sm md:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-base font-light text-navy tracking-wide">Pod Zlatým návrším</span>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Odhlásit
            </button>
          </form>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden">
        <div className="flex items-stretch h-14">
          {primaryItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] tracking-wide transition-colors ${
                isActive(item.href)
                  ? 'text-navy font-medium'
                  : 'text-slate-400'
              }`}
              onClick={() => setMoreOpen(false)}
            >
              <NavIcon href={item.href} active={isActive(item.href)} />
              {item.label}
            </Link>
          ))}

          {/* Více button */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] tracking-wide transition-colors ${
              moreOpen || anySecondaryActive ? 'text-navy font-medium' : 'text-slate-400'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5" />
            </svg>
            Více
          </button>
        </div>
      </nav>

      {/* Mobile "Více" drawer */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-14 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg md:hidden">
            <div className="grid grid-cols-2 gap-px bg-slate-100">
              {secondaryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`bg-white px-4 py-4 text-sm transition-colors ${
                    isActive(item.href)
                      ? 'text-navy font-medium'
                      : 'text-slate-600 hover:text-navy'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom bar spacer so content isn't hidden behind it on mobile */}
      <div className="h-14 md:hidden" />
    </>
  );
}

function NavIcon({ href, active }: { href: string; active: boolean }) {
  const cls = `w-5 h-5 ${active ? 'stroke-navy' : 'stroke-slate-400'}`;
  if (href.includes('leads'))
    return (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    );
  if (href.includes('rezervace'))
    return (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    );
  // Apartmány / default
  return (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}
