'use client';

/**
 * Galerie po kapitolách pro prezentaci apartmánu na prodej.
 * Kapitoly = přepínač nahoře, mřížka fotek s popisky, lightbox (šipky, Esc, swipe).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { GalleryChapter, GalleryCategory } from '@/lib/sale-presentation';

interface Props {
  chapters: GalleryChapter[];
  title: string;
  labels: {
    chapters: Record<GalleryCategory, string>;
    close: string;
    prev: string;
    next: string;
  };
}

export function ChapterGallery({ chapters, title, labels }: Props) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const photos = chapters[active]?.photos ?? [];
  const count = photos.length;

  const step = useCallback(
    (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + count) % count)),
    [count]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, step]);

  if (!chapters.length) return null;

  const alt = (i: number) => photos[i]?.caption ?? `${title} ${i + 1}`;
  const isPlan = chapters[active]?.key === 'plan';

  return (
    <div>
      {/* Kapitoly */}
      <div className="flex flex-wrap gap-2 mb-8" role="tablist">
        {chapters.map((c, i) => (
          <button
            key={c.key}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 text-xs uppercase tracking-widest border transition-colors ${
              i === active ? 'bg-navy text-white border-navy' : 'border-navy/15 text-navy/60 hover:border-navy/40 hover:text-navy'
            }`}
          >
            {labels.chapters[c.key]}
            <span className={`ml-2 ${i === active ? 'text-gold' : 'text-navy/30'}`}>{c.photos.length}</span>
          </button>
        ))}
      </div>

      {/* Mřížka: první fotka velká, ostatní menší */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {photos.map((p, i) => (
          <button
            key={p.url}
            onClick={() => setOpen(i)}
            className={`group relative overflow-hidden text-left ${
              i === 0 ? 'col-span-2 row-span-2 aspect-[4/3] md:aspect-auto md:min-h-[24rem]' : 'aspect-[4/3]'
            } ${isPlan ? 'bg-white border border-navy/10' : 'bg-stone'}`}
          >
            <Image
              src={p.url}
              alt={alt(i)}
              fill
              sizes={i === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
              className={`${isPlan ? 'object-contain p-3' : 'object-cover group-hover:scale-105'} transition-transform duration-500`}
            />
            {p.caption && (
              <span className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-navy/80 to-transparent text-white text-xs md:text-sm font-light opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {p.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {open !== null && photos[open] && (
        <div
          className="fixed inset-0 z-[60] bg-navy flex flex-col"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between px-4 md:px-8 py-4 text-white/70 text-sm">
            <span className="tracking-widest">
              {labels.chapters[chapters[active].key]} · {open + 1} / {count}
            </span>
            <button aria-label={labels.close} className="p-2 hover:text-white" onClick={() => setOpen(null)}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="relative flex-1 mx-2 md:mx-20" onClick={(e) => e.stopPropagation()}>
            <Image
              src={photos[open].url}
              alt={alt(open)}
              fill
              sizes="100vw"
              className={`object-contain ${isPlan ? 'bg-white' : ''}`}
            />
          </div>

          <p className="text-center text-white/80 font-light px-6 py-4 min-h-[3.5rem]">{photos[open].caption ?? ''}</p>

          {count > 1 && (
            <>
              <button
                aria-label={labels.prev}
                className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white"
                onClick={(e) => { e.stopPropagation(); step(-1); }}
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                aria-label={labels.next}
                className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white"
                onClick={(e) => { e.stopPropagation(); step(1); }}
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
