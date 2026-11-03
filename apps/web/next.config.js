/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for development
  reactStrictMode: true,

  // Disable ESLint during build (run separately)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Písmo a podklady obrázků pro sdílení (src/lib/og-card.tsx) čtené přes fs
    outputFileTracingIncludes: {
      '/**': ['./src/assets/og/**/*'],
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.goldenridge.cz',
      },
      {
        protocol: 'https',
        hostname: 'nudiugowvzflokflcokd.supabase.co',
      },
    ],
  },

  // Staré adresy webu na Wixu (sitemap k 3. 11. 2026) → nové stránky, 308 pro zachování SEO.
  // Cíle vedou rovnou na finální stránku (/apartmany-prodej → /suites by byl řetěz).
  async redirects() {
    return [
      // Prodej: dva volné apartmány na svůj detail, ostatní (prodané) na přehled
      { source: '/chata-1-suite-7-1-kk-35m2', destination: '/suites/chata-1-suite-7', permanent: true },
      { source: '/chata-2-suite-11-1-kk-34m2', destination: '/suites/chata-2-suite-11', permanent: true },
      { source: '/:old(chata-[12]-suite-.+)', destination: '/suites', permanent: true },
      { source: '/apartman-prodej-spindleruv-mlyn', destination: '/suites', permanent: true },
      { source: '/apartman-spindlerum-mlyn-prodej-1kk-45m', destination: '/suites', permanent: true },
      { source: '/apartman-spindleruv-mlyn-prodej-1kk-37m', destination: '/suites', permanent: true },
      // Pronájem: /golden-ridge-N → detail apartmánu k pronájmu
      { source: '/golden-ridge-apartman-2', destination: '/apartmany-spindleruv-mlyn-pronajem/golden-ridge-2', permanent: true },
      { source: '/golden-ridge-:n(\\d+)', destination: '/apartmany-spindleruv-mlyn-pronajem/golden-ridge-:n', permanent: true },
      // Stránky, které jen přesměrovávají přes redirect() (= 307) — trvale 308 už tady
      { source: '/investicni-prilezitost', destination: '/kalkulacka', permanent: true },
      { source: '/nemovitostni-produkt', destination: '/podil', permanent: true },
      { source: '/apartmany-prodej', destination: '/suites', permanent: true },
      { source: '/apartmany-prodej/:slug', destination: '/suites/:slug', permanent: true },
      { source: '/golden-ridge-apartments', destination: '/apartmany-spindleruv-mlyn-pronajem', permanent: true },
      // Zrušené stránky
      { source: '/interier', destination: '/standardy', permanent: true },
      { source: '/formular-odeslan', destination: '/', permanent: true },
      { source: '/fullscreen-page-1', destination: '/', permanent: true },
    ];
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
