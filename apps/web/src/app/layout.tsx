import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import '@/styles/bullet-clock.css';
import '@/styles/fonts.css';
import { Navigation } from '@/components/navigation/Navigation';
import { Footer } from '@/components/layout/Footer';
import { PosthogProvider } from '@/components/providers/PosthogProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ChallengeNotifications } from '@/components/challenge/ChallengeNotifications';
import { WebsiteStructuredData, OrganizationStructuredData } from '@/components/seo/StructuredData';
import { PerformanceOptimizer } from '@/components/performance/PerformanceOptimizer';
import { WebVitals } from '@/components/performance/WebVitals';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess960.game';
const siteName = 'Chess960';
const siteDescription = 'Fischer Random Chess with randomized starting positions. No opening theory, just pure chess.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Chess960 - Fischer Random Chess Platform',
    template: '%s | Chess960',
  },
  description: siteDescription,
  keywords: [
    'chess960',
    'fischer random chess',
    'fischer random',
    'chess 960',
    'randomized chess',
    'online chess',
    'bullet chess960',
    'blitz chess960',
    'rapid chess960',
    'classical chess960',
    'chess platform',
    'competitive chess',
    'glicko rating',
    'chess matchmaking',
    'no opening theory',
  ],
  authors: [{ name: 'Chess960 Team' }],
  creator: 'Chess960 Team',
  publisher: 'Chess960',
  applicationName: siteName,
  category: 'Games',
  classification: 'Chess Game Platform',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: siteName,
    title: 'Chess960 - Fischer Random Chess Platform',
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Chess960 - Play Fischer Random Chess Online',
        type: 'image/png',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@Chess960HQ',
    creator: '@Chess960HQ',
    title: 'Chess960 - Fischer Random Chess Platform',
    description: siteDescription,
    images: [`${siteUrl}/og-image.png`],
  },

  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification tags (add your verification codes)
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },

  // PWA
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: siteName,
  },

  // Icons
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  // Preload critical resources for better LCP
  // Fonts are handled by geist/font package automatically

  // Canonical URL
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true, // Enable zoom for accessibility
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f1ea' },
    { media: '(prefers-color-scheme: dark)', color: '#1f1d1a' },
  ],
  viewportFit: 'cover', // For iPhone notch support
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full dark bg-[#1f1d1a] light:bg-[#f5f1ea] ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <PerformanceOptimizer />
        <WebVitals />
        <WebsiteStructuredData />
        <OrganizationStructuredData />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`h-full antialiased ${GeistSans.className} dark bg-[#1f1d1a] light:bg-[#f5f1ea] text-white dark:text-white light:text-black transition-colors`}>
        <SessionProvider>
          <PosthogProvider>
            <ThemeProvider>
              <div id="root" className="h-full flex flex-col">
                <Navigation />
                <ChallengeNotifications />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </ThemeProvider>
          </PosthogProvider>
        </SessionProvider>
      </body>
    </html>
  );
}