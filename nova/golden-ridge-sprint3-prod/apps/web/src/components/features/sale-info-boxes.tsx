'use client';

/**
 * Sale Info Boxes - Standardy & Investiční příležitost
 * Modern UX/UI design with modal popups
 */

import { useState } from 'react';
import Link from 'next/link';

interface InfoBoxProps {
  type: 'standards' | 'investment' | 'realEstateProduct';
  showRealEstateProduct?: boolean;
}

const INFO_DATA = {
  standards: {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    label: 'Standardy',
    annotation: 'Prémiová kvalita',
    color: 'gold',
    content: {
      title: 'Prémiové standardy vybavení',
      sections: [
        {
          title: 'Kuchyně',
          items: ['Electrolux spotřebiče', 'Indukční varná deska', 'Vestavná trouba', 'Myčka nádobí', 'Kombinovaná chladnička']
        },
        {
          title: 'Koupelna',
          items: ['Sanita Laufen', 'Baterie Grohe', 'Podlahové vytápění', 'Velkoformátové obklady', 'Sprchový kout / vana']
        },
        {
          title: 'Interiér',
          items: ['Designový nábytek KARE', 'Podlahové vytápění', 'Klimatizace', 'Smart TV', 'Vysokorychlostní Wi-Fi']
        },
        {
          title: 'Bezpečnost',
          items: ['Trezor', 'Protipožární systém', 'Elektronický zámek', 'Videovzráfon']
        }
      ]
    }
  },
  investment: {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    label: 'Investiční příležitost',
    annotation: 'Výnos 4-6 % p.a.',
    color: 'emerald',
    content: {
      title: 'Proč investovat do apartmánu',
      sections: [
        {
          title: 'Stabilní výnosy',
          items: ['Očekávaný výnos 4-6 % ročně', 'Celoroční turistická destinace', 'Rostoucí zájem o horské rekreace', 'Profesionální správa pronájmu']
        },
        {
          title: 'Prémiová lokalita',
          items: ['50 m od lanovky Labská', 'Centrum Špindlerova Mlýna', 'Blízko lyžařských tratí', 'Dostupné z Prahy (2h)']
        },
        {
          title: 'Růst hodnoty',
          items: ['Limitovaná nabídka v centru', 'Historicky rostoucí ceny', 'Kvalitní stavba s dlouhou životností', 'Prestižní projekt']
        },
        {
          title: 'Vlastní užívání',
          items: ['Kombinace investice a rekreace', 'Flexibilní využití', 'Plně vybaveno k okamžitému užívání', 'Bez starostí s údržbou']
        }
      ]
    }
  },
  realEstateProduct: {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    label: 'Nemovitostní produkt',
    annotation: 'Podílové vlastnictví',
    color: 'blue',
    content: {
      title: 'Podílové vlastnictví apartmánu',
      sections: [
        {
          title: 'Jak to funguje',
          items: ['Kupte si 1/12 podíl na apartmánu', 'Právo užívání 4 týdny ročně', 'Sdílené náklady na údržbu', 'Bez starostí s pronájmem']
        },
        {
          title: 'Výhody',
          items: ['Nižší vstupní investice', 'Garantované týdny v roce', 'Profesionální správa', 'Možnost směny termínů']
        }
      ]
    }
  }
};

export function SaleInfoBoxes({ showRealEstateProduct = false }: { showRealEstateProduct?: boolean }) {
  const [openModal, setOpenModal] = useState<'standards' | 'investment' | 'realEstateProduct' | null>(null);

  const boxes = showRealEstateProduct 
    ? ['standards', 'investment', 'realEstateProduct'] as const
    : ['standards', 'investment'] as const;

  return (
    <>
      {/* Info Boxes Grid */}
      <div className={`grid ${showRealEstateProduct ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 mb-16`}>
        {boxes.map((type) => {
          const data = INFO_DATA[type];
          const colorClasses = {
            gold: 'border-gold/30 hover:border-gold bg-gradient-to-br from-gold/5 to-gold/10 hover:from-gold/10 hover:to-gold/20',
            emerald: 'border-emerald-500/30 hover:border-emerald-500 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 hover:from-emerald-500/10 hover:to-emerald-500/20',
            blue: 'border-blue-500/30 hover:border-blue-500 bg-gradient-to-br from-blue-500/5 to-blue-500/10 hover:from-blue-500/10 hover:to-blue-500/20',
          };
          const iconColors = {
            gold: 'text-gold',
            emerald: 'text-emerald-600',
            blue: 'text-blue-600',
          };
          const annotationColors = {
            gold: 'bg-gold/20 text-gold-700',
            emerald: 'bg-emerald-100 text-emerald-700',
            blue: 'bg-blue-100 text-blue-700',
          };

          return (
            <button
              key={type}
              onClick={() => setOpenModal(type)}
              className={`group relative p-6 border-2 rounded-2xl transition-all duration-300 text-left ${colorClasses[data.color as keyof typeof colorClasses]}`}
            >
              {/* Annotation badge */}
              <span className={`absolute -top-3 right-4 px-3 py-1 text-xs font-medium rounded-full ${annotationColors[data.color as keyof typeof annotationColors]}`}>
                {data.annotation}
              </span>
              
              {/* Icon */}
              <div className={`mb-4 ${iconColors[data.color as keyof typeof iconColors]}`}>
                {data.icon}
              </div>
              
              {/* Label */}
              <h3 className="text-lg font-medium text-navy mb-2">{data.label}</h3>
              
              {/* CTA */}
              <span className="inline-flex items-center text-sm text-navy/60 group-hover:text-navy transition-colors">
                Zobrazit detail
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {openModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpenModal(null)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white border-b border-navy/10">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  openModal === 'standards' ? 'bg-gold/10 text-gold' :
                  openModal === 'investment' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {INFO_DATA[openModal].icon}
                </div>
                <h2 className="text-2xl font-light text-navy">
                  {INFO_DATA[openModal].content.title}
                </h2>
              </div>
              <button 
                onClick={() => setOpenModal(null)}
                className="p-2 text-navy/40 hover:text-navy transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {INFO_DATA[openModal].content.sections.map((section, i) => (
                <div key={i}>
                  <h3 className="text-sm text-navy/40 uppercase tracking-widest mb-4">{section.title}</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {section.items.map((item, j) => (
                      <div key={j} className="flex items-start gap-3 p-3 bg-stone rounded-xl">
                        <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          openModal === 'standards' ? 'text-gold' :
                          openModal === 'investment' ? 'text-emerald-500' :
                          'text-blue-500'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-navy/80">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
              <Link
                href={openModal === 'standards' ? '/standardy' : openModal === 'investment' ? '/investicni-prilezitost' : '/nemovitostni-produkt'}
                className={`block w-full py-4 text-center text-sm uppercase tracking-widest transition-colors ${
                  openModal === 'standards' ? 'bg-gold hover:bg-gold-400 text-navy' :
                  openModal === 'investment' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                  'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Zobrazit celou stránku
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Real Estate Product Badge for apartment detail
export function RealEstateProductBadge() {
  return (
    <Link 
      href="/nemovitostni-produkt"
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm hover:bg-blue-100 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
      Součást nemovitostního produktu
    </Link>
  );
}
