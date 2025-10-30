'use client';

import { useEffect } from 'react';

export function PerformanceOptimizer() {
  useEffect(() => {
    // Preload critical images for LCP optimization
    const preloadImages = [
      '/bobby-fischer.png',
      '/og-image.png',
      '/logo.png',
    ];

    preloadImages.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    // CSS is already loaded via Next.js imports in layout.tsx
    // No need to preload CSS files manually

    // Optimize font loading
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        // Fonts are loaded, we can now optimize rendering
        document.documentElement.classList.add('fonts-loaded');
      });
    }

    // Preconnect to external domains
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    preconnectDomains.forEach((domain) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Optimize third-party scripts loading
    const optimizeThirdParty = () => {
      // Defer non-critical scripts
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach((script) => {
        if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
          const src = script.getAttribute('src');
          if (src && !src.includes('critical')) {
            script.setAttribute('defer', '');
          }
        }
      });
    };

    // Run optimization after initial load
    setTimeout(optimizeThirdParty, 1000);
  }, []);

  return null;
}
