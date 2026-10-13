'use client';

/**
 * Footer - Alpine Quiet Luxury Design
 */

import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { AlpineOrnament } from '@/components/ui/ornaments';
import { SALES_COMPANY } from '@/data/sales-company';
import apartmentsData from '@/data/apartments.canonical.json';

const salesManager = apartmentsData.salesManager;

export function Footer() {
  const { t, locale } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white">
      {/* Top ornament */}
      <div className="border-b border-white/10 py-4">
        <AlpineOrnament variant="horizontal" className="w-full max-w-md mx-auto h-4 text-gold/30" />
      </div>
      
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
              <Link href="/apartmany-spindleruv-mlyn-pronajem" className="block text-white/60 hover:text-gold transition-colors text-sm">
                {t('nav.rental')}
              </Link>
              <Link href="/lokalita" className="block text-white/60 hover:text-gold transition-colors text-sm">
                {t('nav.location')}
              </Link>
              <Link href="/suites" className="block text-white/60 hover:text-gold transition-colors text-sm">
                {t('nav.saleApartments')}
              </Link>
              <Link href="/o-projektu" className="block text-white/60 hover:text-gold transition-colors text-sm">
                {t('nav.about')}
              </Link>
              <Link href="/kalkulacka" className="block text-white/60 hover:text-gold transition-colors text-sm">
                {t('nav.investment')}
              </Link>
              <Link href="/kontakt" className="block text-white/60 hover:text-gold transition-colors text-sm">
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

            <p className="text-white/40 text-sm uppercase tracking-widest mt-10 mb-4">
              {t('footer.saleContact')}
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-white/80">{salesManager.name}</p>
              <a href={`tel:${salesManager.phone.replace(/\s/g, '')}`} className="block text-white/60 hover:text-gold transition-colors">
                {salesManager.phone}
              </a>
              <a href={`mailto:${salesManager.email}`} className="block text-white/60 hover:text-gold transition-colors">
                {salesManager.email}
              </a>
            </div>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white/30 text-sm space-y-1 text-center md:text-left">
            <p>© {year} Pod Zlatým návrším</p>
            <p className="text-xs text-white/25">
              {t('footer.seller')}: {SALES_COMPANY.name}, {SALES_COMPANY.address}, {locale === 'en' ? 'Company ID' : locale === 'pl' ? 'IČO' : 'IČ'} {SALES_COMPANY.ico}, {locale === 'en' ? 'VAT ID' : locale === 'pl' ? 'NIP (DIČ)' : 'DIČ'} {SALES_COMPANY.dic},{' '}
              {locale === 'cs' ? `sp. zn. ${SALES_COMPANY.registerCs}` : locale === 'pl' ? `sygn. ${SALES_COMPANY.registerPl}` : `file no. ${SALES_COMPANY.registerEn}`}
            </p>
          </div>
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
