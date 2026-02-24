'use client';

/**
 * Apartment photo gallery component
 */

import { useState } from 'react';
import Image from 'next/image';

interface ApartmentGalleryProps {
  images: string[];
  title: string;
}

export function ApartmentGallery({ images, title }: ApartmentGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="relative aspect-video bg-stone flex items-center justify-center">
        <p className="text-navy/40">Fotografie nejsou k dispozici</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <div className="space-y-4">
        {/* Hero Image */}
        <div 
          className="relative aspect-video cursor-pointer overflow-hidden group"
          onClick={() => setIsLightboxOpen(true)}
        >
          <Image
            src={images[selectedIndex]}
            alt={`${title} - foto ${selectedIndex + 1}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 66vw"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 text-white text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-6 gap-2">
            {images.slice(0, 6).map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`relative aspect-square overflow-hidden ${
                  i === selectedIndex ? 'ring-2 ring-gold' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img}
                  alt={`${title} - náhled ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="100px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setIsLightboxOpen(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white/80 hover:text-white p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                className="absolute right-4 text-white/80 hover:text-white p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                }}
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          {/* Image */}
          <div 
            className="relative w-full h-full max-w-6xl max-h-[80vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedIndex]}
              alt={`${title} - foto ${selectedIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
