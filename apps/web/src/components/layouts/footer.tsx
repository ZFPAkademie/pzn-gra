'use client';

/**
 * Footer - Design Checklist 2030
 * Plný znak pouze: patička, investiční materiály, tisk
 */

import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        
        {/* Main footer content */}
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <span className="text-xl font-medium text-white">Pod Zlatým</span>
              <span className="text-xl font-light text-white/70 ml-1">návrším</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm">
              {t('footer.description')}
            </p>
          </div>
          
          {/* Navigation */}
          <div>
            <p className="text-white/40 text-sm uppercase tracking-widest mb-6">
              {t('footer.navigation')}
            </p>
            <nav className="space-y-3">
              <Link href="/o-projektu" className="block text-white/60 hover:text-white transition-colors text-sm">
                {t('nav.about')}
              </Link>
              <Link href="/suites" className="block text-white/60 hover:text-white transition-colors text-sm">
                {t('nav.sale')}
              </Link>
              <Link href="/apartmany-spindleruv-mlyn-pronajem" className="block text-white/60 hover:text-white transition-colors text-sm">
                {t('nav.rental')}
              </Link>
              <Link href="/kalkulacka" className="block text-white/60 hover:text-white transition-colors text-sm">
                {t('nav.investment')}
              </Link>
              <Link href="/lokalita" className="block text-white/60 hover:text-white transition-colors text-sm">
                {t('nav.location')}
              </Link>
              <Link href="/kontakt" className="block text-white/60 hover:text-white transition-colors text-sm">
                {t('nav.contact')}
              </Link>
            </nav>
          </div>
          
          {/* Contact */}
          <div>
            <p className="text-white/40 text-sm uppercase tracking-widest mb-6">
              {t('footer.contact')}
            </p>
            <div className="space-y-3 text-sm">
              <p className="text-white/60">info@podzlatymnavrsim.cz</p>
              <p className="text-white/60">Špindlerův Mlýn</p>
              <p className="text-white/60">543 51</p>
            </div>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-sm">
            © {year} Pod Zlatým návrším
          </p>
          <div className="flex items-center space-x-6 text-sm">
            <Link href="#" className="text-white/30 hover:text-white/60 transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link href="#" className="text-white/30 hover:text-white/60 transition-colors">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
