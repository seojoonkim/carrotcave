import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import CaveTorch from '@/components/CaveTorch';
import { siteDescription, siteName } from '@/lib/social-metadata';

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const notoSans = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://carrotcave.com'),
  title: `${siteName} · 토끼를 따라왔는데, 생각이 길을 잃었습니다.`,
  description: siteDescription,
  alternates: { canonical: '/', types: { 'application/rss+xml': [{ url: '/rss.xml', title: 'Carrot Cave' }] } },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: '/',
    siteName,
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: '#282a36',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${plexMono.variable} ${notoSans.variable}`}>
      <head>
        <link rel="stylesheet" href="/shared-header-chrome.css" />
        <link rel="stylesheet" href="/reading-end.css" />
        <link rel="stylesheet" href="/fonts/pretendard/pretendardvariable-dynamic-subset.css" />
      </head>
      <body
        className="antialiased min-h-screen"
        style={{ backgroundColor: '#282a36', color: '#eceef5' }}
      >
        <CaveTorch />
        {children}
        <script src="/stats-beacon.js" defer />
      </body>
    </html>
  );
}
