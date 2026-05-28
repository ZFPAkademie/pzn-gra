/**
 * Homepage
 * Sprint 1: Main landing page per SPRINT_1_PLAN.md §3.1
 * 
 * URL: /
 */

import { HeroSection, PathSelector, FeaturesSection } from '@/components/features';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PathSelector />
      <FeaturesSection />
    </>
  );
}
