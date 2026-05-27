'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin/leads', label: 'Leady' },
  { href: '/admin/rezervace', label: 'Rezervace' },
  { href: '/admin/ceniky', label: 'Ceníky' },
  { href: '/admin/blokace', label: 'Blokace' },
  { href: '/admin/majitele', label: 'Majitelé' },
  { href: '/admin/channel-manager', label: 'Channel Manager' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <span className="text-lg font-light text-navy tracking-wide">Pod Zlatým návrším</span>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  pathname.startsWith(item.href)
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
  );
}
