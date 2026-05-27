'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

export function PortalNav({ ownerName, apartments, userEmail }: PortalNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hasRental = apartments.some((a) => a.in_rental_program);

  const items = hasRental ? [...navItems, rentalNavItem] : navItems;

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/portal/login');
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0B1626] flex flex-col">
      {/* Header */}
      <div className="px-6 py-8 border-b border-white/10">
        <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">
          Pod Zlatým návrším
        </p>
        <p className="text-white font-light text-sm">Klientský portál</p>
      </div>

      {/* Owner info */}
      <div className="px-6 py-5 border-b border-white/10">
        <p className="text-white/40 text-xs mb-1">Přihlášen jako</p>
        <p className="text-white text-sm font-light truncate">{ownerName || userEmail}</p>
        {apartments.length > 1 && (
          <p className="text-[#C9A24D] text-xs mt-1">{apartments.length} apartmány</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {items.map((item) => {
          const active = item.href === '/portal'
            ? pathname === '/portal'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                active
                  ? 'bg-[#C9A24D]/15 text-[#C9A24D]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
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
    </aside>
  );
}
