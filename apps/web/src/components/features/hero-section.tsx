'use client';

/**
 * Hero Section Component
 * Sprint 1: Homepage hero per SPRINT_1_PLAN.md §5.2
 */

import { Container } from '@/components/ui';
import { useLanguage } from '@/components/providers/language-provider';

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative bg-navy text-white">
      {/* Background placeholder - replace with actual image */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-navy">
        {/* Placeholder pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
      </div>

      <Container className="relative">
        <div className="py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              {t('home.heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-stone-400 mb-8">
              {t('home.heroSubtitle')}
            </p>
            
            {/* Mountain icon placeholder */}
            <div className="flex items-center space-x-2 text-stone-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 22h20L12 2zm0 4l7.53 14H4.47L12 6z"/>
              </svg>
              <span>Špindlerův Mlýn, Krkonoše</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
