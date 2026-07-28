'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

interface Apartment {
  id: string;
  slug: string;
  unit: string;
  building: string;
  in_rental_program: boolean;
}

interface PortalNavProps {
  ownerName: string;
  apartments: Apartment[];
  userEmail: string;
}

const navItems = [
  {
    label: 'Můj apartmán',
    href: '/portal',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Dokumenty',
    href: '/portal/dokumenty',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Údržba',
    href: '/portal/udrzba',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'SVJ',
    href: '/portal/svj',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const rentalNavItem = {
  label: 'Pronájem',
  href: '/portal/pronajem',
  icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

const profileNavItem = {
  label: 'Profil',
  href: '/portal/profil',
  icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export function PortalNav({ ownerName, apartments, userEmail }: PortalNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasRental = apartments.some((a) => a.in_rental_program);

  const items = [
    ...navItems,
    ...(hasRental ? [rentalNavItem] : []),
    profileNavItem,
  ];

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/portal/login');
    router.refresh();
  }

  function isActive(href: string) {
    return href === '/portal' ? pathname === '/portal' : pathname.startsWith(href);
  }

  const navLinks = (onNavigate?: () => void) => (
    <nav className="flex-1 px-4 py-6 space-y-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
            isActive(item.href)
              ? 'bg-[#C9A24D]/15 text-[#C9A24D]'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const logoutButton = (
    <div className="px-4 pb-6">
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 w-full text-white/30 hover:text-white/60 text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Odhlásit se
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#0B1626] flex-col">
        <div className="px-6 py-8 border-b border-white/10">
          <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">
            Pod Zlatým návrším
          </p>
          <p className="text-white font-light text-sm">Klientský portál</p>
        </div>

        <div className="px-6 py-5 border-b border-white/10">
          <p className="text-white/40 text-xs mb-1">Přihlášen jako</p>
          <p className="text-white text-sm font-light truncate">{ownerName || userEmail}</p>
          {apartments.length > 1 && (
            <p className="text-[#C9A24D] text-xs mt-1">{apartments.length} apartmány</p>
          )}
        </div>

        {navLinks()}
        {logoutButton}
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0B1626] flex items-center justify-between px-4 h-14">
        <div>
          <p className="text-[#C9A24D] text-[10px] tracking-[0.25em] uppercase leading-tight">
            Pod Zlatým návrším
          </p>
          <p className="text-white font-light text-xs leading-tight">Klientský portál</p>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Zavřít menu' : 'Otevřít menu'}
          className="text-white/70 hover:text-white p-2 -mr-2"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 top-14 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed top-14 left-0 right-0 z-50 bg-[#0B1626] border-t border-white/10 flex flex-col max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="px-6 py-4 border-b border-white/10">
              <p className="text-white/40 text-xs mb-1">Přihlášen jako</p>
              <p className="text-white text-sm font-light truncate">{ownerName || userEmail}</p>
            </div>
            {navLinks(() => setMobileOpen(false))}
            {logoutButton}
          </div>
        </>
      )}
    </>
  );
}
