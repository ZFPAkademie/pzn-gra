'use client';

/**
 * Ovládání prezentace /podil-prezentace — slidy připravuje serverová stránka,
 * tady jen navigace: šipky / PageUp-Down / mezerník, swipe na tabletu,
 * celá obrazovka (F), číslo slidu v URL (#3) pro návrat po obnovení.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';

export function Deck({ slides, titles }: { slides: ReactNode[]; titles: string[] }) {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const count = slides.length;

  const go = useCallback(
    (next: number) => setIndex(Math.min(Math.max(next, 0), count - 1)),
    [count]
  );

  // Slide z URL (#3) při načtení
  useEffect(() => {
    const n = parseInt(window.location.hash.slice(1), 10);
    if (!Number.isNaN(n)) go(n - 1);
  }, [go]);

  useEffect(() => {
    window.history.replaceState(null, '', `#${index + 1}`);
  }, [index]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        go(index + 1);
      } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(count - 1);
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, go, toggleFullscreen]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // jen výrazně vodorovný pohyb — svislý slouží k posunu dlouhého slidu na mobilu
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <div
      className="fixed inset-0 bg-navy text-white overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((slide, i) => (
        <section
          key={i}
          aria-hidden={i !== index}
          aria-label={titles[i]}
          className={`absolute inset-0 overflow-y-auto transition-opacity duration-500 ease-out ${
            i === index ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {slide}
        </section>
      ))}

      {/* Ovládací lišta */}
      <nav className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between gap-4 px-4 sm:px-8 py-3 bg-gradient-to-t from-navy/90 to-transparent">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="h-11 w-11 flex items-center justify-center border border-white/20 text-white/80 hover:border-gold hover:text-gold disabled:opacity-25 disabled:hover:border-white/20 disabled:hover:text-white/80 transition-colors"
          aria-label="Předchozí slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {titles.map((title, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              className="group py-4 px-0.5"
              aria-label={`${i + 1}. ${title}`}
              title={title}
            >
              <span
                className={`block h-[3px] transition-all duration-300 ${
                  i === index ? 'w-8 bg-gold' : 'w-3 sm:w-4 bg-white/25 group-hover:bg-white/50'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-white/50 tabular-nums">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex h-11 w-11 items-center justify-center border border-white/20 text-white/80 hover:border-gold hover:text-gold transition-colors"
            aria-label={isFullscreen ? 'Ukončit celou obrazovku' : 'Celá obrazovka'}
            title="Celá obrazovka (F)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === count - 1}
            className="h-11 w-11 flex items-center justify-center bg-gold text-navy hover:bg-gold/90 disabled:opacity-25 transition-colors"
            aria-label="Další slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
}

/** Galerie fotek apartmánu: velká fotka + náhledy k přepnutí. */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="relative flex-1 min-h-[40vh] overflow-hidden bg-white/5">
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={`${alt} — foto ${i + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 75vw"
            className={`object-cover transition-opacity duration-500 ${i === active ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            className={`relative flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 overflow-hidden border-2 transition-colors ${
              i === active ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            aria-label={`Foto ${i + 1}`}
          >
            <Image src={src} alt="" fill sizes="96px" loading="eager" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
